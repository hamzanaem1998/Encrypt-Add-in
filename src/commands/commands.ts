import { getAttachmentsDecryptCallback } from "../taskpane/utils/attachmentsHandler";
import { decrypt } from "../taskpane/utils/encryptDecrypt";

const pki = require("node-forge").pki;

Office.onReady(() => {
  if (Office.context.platform === Office.PlatformType.PC || Office.context.platform == null) {
    console.log("office loaded!");
  }
});

function onMessageSendHandler(event) {
  if (Office.context.mailbox.item.getComposeTypeAsync) {
    //Find out if the compose type is "newEmail", "reply", or "forward" so that we can apply the related processing.
    Office.context.mailbox.item.getComposeTypeAsync(
      {
        asyncContext: {
          eventObj: event,
        },
      },
      function (asyncResult) {
        if ((asyncResult.status as any) === "succeeded") {
          Office.context.mailbox.item.body.getAsync("text", { asyncContext: event }, encryptSign);
        }
      }
    );
  }
}

const bodyWritter = (data: string) => {
  return new Promise((resolve) => {
    Office.context.mailbox.item.body.setAsync(data, { coercionType: Office.CoercionType.Text }, function () {
      resolve("");
    });
  });
};

async function OnNewMessageComposeHandler(event) {
  if (Office.context.mailbox.item.getComposeTypeAsync) {
    //Find out if the compose type is "newEmail", "reply", or "forward" so that we can apply the related processing.
    Office.context.mailbox.item.getComposeTypeAsync(
      {
        asyncContext: {
          eventObj: event,
        },
      },
      async function (asyncResult) {
        if ((asyncResult.status as any) === "succeeded") {
          if (asyncResult.value.composeType === "forward" || asyncResult.value.composeType === "reply") {
            await bodyWritter("");
            let fileKey = window.localStorage.getItem("Key");
            let passKey = window.localStorage.getItem("passKey");
            let privateKey = pki.decryptRsaPrivateKey(fileKey, passKey);
            let item = Office.context.mailbox.item;
            let options = { asyncContext: { currentItem: item, privateKey: privateKey } };
            item.getAttachmentsAsync(options, getAttachmentsDecryptCallback);
            item.body.getAsync("text", { asyncContext: { event, privateKey } }, decryptEmail);
          }
        }
      }
    );
  }
}

function encryptSign(asyncResult: Office.AsyncResult<string>) {
  const event = asyncResult.asyncContext;
  if (!asyncResult.value.replace(/ /g, " ").includes("BEGIN PKCS7")) {
    event.completed({
      allowEvent: false,
      errorMessage: "Veuillez Chiffrer/Signer votre avant envoie!",
      cancelLabel: "Chiffrer/Signer",
      commandId: "msgReadOpenPaneButton2",
    });
  } else event.completed({ allowEvent: true });
}

async function decryptEmail(asyncResult: Office.AsyncResult<string>) {
  const event = asyncResult.asyncContext.event;
  const privateKey = asyncResult.asyncContext.privateKey;

  const forwardBody = asyncResult.value;
  if (forwardBody.includes("----BEGIN PKCS7-----")) {
    //let's get the pkcs7 content
    const pkcsContent = forwardBody.split("\r\n \r\n")[1].replace(/ /g, " ");
    const decryptedData = decrypt(pkcsContent, privateKey);
    let body = decryptedData.split("\n signature:\n");
    await bodyWritter(`${forwardBody.split("\r\n \r\n")[0]}\r\n \r\n${body[0]}`);
  }
  event.completed({ allowEvent: true });
}

Office.actions.associate("onMessageSendHandler", onMessageSendHandler);
Office.actions.associate("OnNewMessageComposeHandler", OnNewMessageComposeHandler);
