// import { encrypt, decrypt } from "./encryptDecrypt";
// import { sign } from "./sigVerif";
var encrypt = require("./encryptDecrypt").encrypt;
var sign = require("./sigVerif").sign;
const encryptedAttachmentPrefix = "encrypted_";
const pki = require("node-forge").pki;
import { decrypt } from "./encryptDecrypt";

export function getAttachmentsCallback(result: Office.AsyncResult<any>) {
  if (result.value.length > 0) {
    Office.context.mailbox.item.notificationMessages.addAsync(
      "processingAttachments",
      {
        type: Office.MailboxEnums.ItemNotificationMessageType.ProgressIndicator,
        message: `Please wait while attachments are encrypted...`,
      },
      function (asyncResult) {
        //Encrypt base64 file data using CryptoJS
        if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
          try {
            for (let i = 0; i < result.value.length; i++) {
              if (!(result.value[i].name as string).startsWith("encrypted_")) {
                const options: Office.AsyncContextOptions = {
                  asyncContext: {
                    ...result.asyncContext,
                    ...{
                      fileName: result.value[i].name,
                      attachmentId: result.value[i].id,
                      contentType: result.value[i].contentType,
                    },
                  },
                };
                result.asyncContext.currentItem.getAttachmentContentAsync(
                  result.value[i].id,
                  options,
                  handleAttachmentsCallback
                );
              }
            }
          } catch (ex) {
            console.error(`handleAttachmentsCallback(): Error: ${ex}`);
            Office.context.mailbox.item.notificationMessages.removeAsync(
              "processingAttachments",
              function (_asyncResult2) {
                console.log("handleAttachmentsCallback(): Notification message removed.");
                //asyncResult2.asyncContext.callingEvent.completed();
              }
            );
          }
        } else {
          console.error(`handleAttachmentsCallback(): Unexpected - status is ${asyncResult.status}`);
          //asyncResult.asyncContext.callingEvent.completed();
        }
      }
    );
  }
}
export function getAttachmentsDecryptCallback(result: Office.AsyncResult<any>) {
  if (result.value.length > 0) {
    Office.context.mailbox.item.notificationMessages.addAsync(
      "processingAttachmentsDecrypt",
      {
        type: Office.MailboxEnums.ItemNotificationMessageType.ProgressIndicator,
        message: `Please wait while attachments are decrypted...`,
      },
      function (asyncResult) {
        //Encrypt base64 file data using CryptoJS
        if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
          try {
            for (let i = 0; i < result.value.length; i++) {
              if ((result.value[i].name as string).startsWith("encrypted_")) {
                const options: Office.AsyncContextOptions = {
                  asyncContext: {
                    ...result.asyncContext,
                    ...{
                      fileName: result.value[i].name,
                      attachmentId: result.value[i].id,
                      contentType: result.value[i].contentType,
                    },
                  },
                };
                result.asyncContext.currentItem.getAttachmentContentAsync(
                  result.value[i].id,
                  options,
                  handleAttachmentsDecryptCallback
                );
              }
            }
          } catch (ex) {
            console.error(`handleAttachmentsCallback(): Error: ${ex}`);
            Office.context.mailbox.item.notificationMessages.removeAsync(
              "processingAttachments",
              function (_asyncResult2) {
                console.log("handleAttachmentsCallback(): Notification message removed.");
                //asyncResult2.asyncContext.callingEvent.completed();
              }
            );
          }
        } else {
          console.error(`handleAttachmentsCallback(): Unexpected - status is ${asyncResult.status}`);
          //asyncResult.asyncContext.callingEvent.completed();
        }
      }
    );
  }
}
/**
 * Method that encrypts base64 file data using CryptoJS and attaches the file to the email. Cloud, .eml and .ICalendar attachments will not be processed.
 * @param {Office.AsyncResult} result default: Office.AsyncResult
 */
function handleAttachmentsCallback(result: Office.AsyncResult<any>) {
  console.log(`handleAttachmentsCallback(): result.value.format = ${result.value.format}`);
  // console.dir(result.value.content); //NOTE: If you want to see the base64 data output to the console, uncomment this line - but console.dir() functions cannot be used when runtime logging is enabled!!

  // Parse string to be a url, an .eml file, a base64-encoded string, or an .icalendar file.
  switch (result.value.format) {
    case Office.MailboxEnums.AttachmentContentFormat.Base64:
      //Handle file attachment
      //Set a notification message that we're processing the attachment. Note that this will be removed immediately after the decrypted attachment is added, and it may not be displayed for very long
      let pem = pki.privateKeyToPem(result.asyncContext.privateKey);

      var signed = sign(result.value.content, pem);
      console.log("PEEEEMMMMM", result.asyncContext.pub_key);
      var toencdata = window.btoa(
        result.value.content +
          "\n signature:\n" +
          signed +
          "\n cert:\n" +
          result.asyncContext.pub_key +
          "\n type:\n" +
          result.asyncContext.contentType
      );
      var ciphertext = encrypt(toencdata, result.asyncContext.pub_key);
      console.log("PEEEEMMMMM", ciphertext);
      //Then attaches the file to the email
      console.log(`handleAttachmentsCallback(): starting processing of file '${result.asyncContext.fileName}'...`);
      encryptAttachment(
        ciphertext,
        result.asyncContext.fileName,
        result.asyncContext.callingEvent,
        result.asyncContext.attachmentId
      );
      break;
    case Office.MailboxEnums.AttachmentContentFormat.Eml:
      // Handle email item attachment.
      console.log("handleAttachmentsCallback(): Attachment is a message.");
      //result.asyncContext.callingEvent.completed();
      break;
    case Office.MailboxEnums.AttachmentContentFormat.ICalendar:
      // Handle .icalender attachment.
      console.log("handleAttachmentsCallback(): Attachment is a calendar item.");
      //result.asyncContext.callingEvent.completed();
      break;
    case Office.MailboxEnums.AttachmentContentFormat.Url:
      // Handle cloud attachment.
      console.log("handleAttachmentsCallback(): Attachment is a cloud attachment.");
      //result.asyncContext.callingEvent.completed();
      break;
    default:
      // Handle attachment formats that are not supported.
      console.warn();
      "handleAttachmentsCallback(): Not handling unsupported attachment.";
      //result.asyncContext.callingEvent.completed();
      break;
  }
}
/**
 * Method that converts encrypted data to base64 and creates and adds a file attachment to the current email
 * @param {string} encryptedData default: "undefined"
 * @param {Office.AsyncResult} callingEvent default: Office.AsyncResult. The event parameter from the action event
 */
function encryptAttachment(
  encryptedData: string,
  fileName: string,
  callingEvent: Office.AsyncResult<string>,
  attachmentId: any
) {
  console.log(`encryptAttachment(): Encrypting file '${fileName}'...`);
  // console.dir(encryptedData); //NOTE: If you want to see the encrypted data output to the console, uncomment this line

  var base64EncryptedData = window.btoa(encryptedData);
  var encryptedFileName = `${encryptedAttachmentPrefix}${fileName}.pkcs7`;
  var options = { asyncContext: { encryptedFileName: encryptedFileName, callingEvent: callingEvent }, isInline: false };

  //NOTE: If you want to see the base64 data output to the console, uncomment these lines
  // console.log("encryptAttachment(): base64 encrypted data:");
  // console.dir(base64EncryptedData);

  console.log(`encryptAttachment(): Adding encrypted file '${encryptedFileName}'...`);
  Office.context.mailbox.item.addFileAttachmentFromBase64Async(
    base64EncryptedData,
    encryptedFileName,
    options,
    function (asyncResult) {
      options = {
        asyncContext: {
          encryptedFileName: asyncResult.asyncContext.encryptedFileName,
          callingEvent: asyncResult.asyncContext.callingEvent,
        },
        isInline: false,
      };
      console.log(
        `encryptAttachment(): Added encrypted attachment '${asyncResult.asyncContext.encryptedFileName}'; now decrypting...`
      );
      return Office.context.mailbox.item.removeAttachmentAsync(attachmentId, options);
      //console.dir(asyncResult); //NOTE: If you want to see the base64 data output to the console, uncomment this line
      // decryptAttachment(options);
    }
  );
}

export function bToBinary(dataInput: string) {
  var bstr = atob(dataInput),
    n = dataInput.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return u8arr;
}

/**
 * Method that decryptss base64 file data using CryptoJS and attaches the file to the email. Cloud, .eml and .ICalendar attachments will not be processed.
 * @param {Office.AsyncResult} result default: Office.AsyncResult
 */
function handleAttachmentsDecryptCallback(result: Office.AsyncResult<any>) {
  console.log(`handleAttachmentsCallback(): result.value.format = ${result.value.format}`);
  // console.dir(result.value.content); //NOTE: If you want to see the base64 data output to the console, uncomment this line - but console.dir() functions cannot be used when runtime logging is enabled!!

  // Parse string to be a url, an .eml file, a base64-encoded string, or an .icalendar file.
  switch (result.value.format) {
    case Office.MailboxEnums.AttachmentContentFormat.Base64:
      var privateKey = result.asyncContext.privateKey;
      var content = atob(result.value.content);
      var decryptedData = atob(decrypt(content, privateKey));
      var attachType = decryptedData.split("\n type:\n")[1];
      var attach = decryptedData.split("\n type:\n")[0].split("\n signature:\n");

      var base64Data = attach[0];
      var fileName = result.asyncContext.fileName.replace(".pkcs7", "").replace("encrypted_", "");
      var options = {
        asyncContext: { fileName: fileName, callingEvent: result.asyncContext.callingEvent },
        isInline: false,
      };

      Office.context.mailbox.item.addFileAttachmentFromBase64Async(
        base64Data,
        fileName,
        options,
        function (asyncResult) {
          options = {
            asyncContext: {
              fileName: asyncResult.asyncContext.fileName,
              callingEvent: asyncResult.asyncContext.callingEvent,
            },
            isInline: false,
          };
          console.log(
            `encryptAttachment(): Added encrypted attachment '${asyncResult.asyncContext.encryptedFileName}'; now decrypting...`
          );
          return Office.context.mailbox.item.removeAttachmentAsync(result.asyncContext.attachmentId, options);
          //console.dir(asyncResult); //NOTE: If you want to see the base64 data output to the console, uncomment this line
          // decryptAttachment(options);
        }
      );

      break;
    case Office.MailboxEnums.AttachmentContentFormat.Eml:
      // Handle email item attachment.
      console.log("handleAttachmentsCallback(): Attachment is a message.");
      //result.asyncContext.callingEvent.completed();
      break;
    case Office.MailboxEnums.AttachmentContentFormat.ICalendar:
      // Handle .icalender attachment.
      console.log("handleAttachmentsCallback(): Attachment is a calendar item.");
      //result.asyncContext.callingEvent.completed();
      break;
    case Office.MailboxEnums.AttachmentContentFormat.Url:
      // Handle cloud attachment.
      console.log("handleAttachmentsCallback(): Attachment is a cloud attachment.");
      //result.asyncContext.callingEvent.completed();
      break;
    default:
      // Handle attachment formats that are not supported.
      console.warn();
      "handleAttachmentsCallback(): Not handling unsupported attachment.";
      //result.asyncContext.callingEvent.completed();
      break;
  }
}
