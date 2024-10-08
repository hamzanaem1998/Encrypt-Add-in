import React, { useEffect, useState } from "react";
import { CheckmarkCircle24Filled, ErrorCircle24Filled } from '@fluentui/react-icons';
import Swal from "sweetalert2";
import decryptTaskPaneStyle from "../styles/decryptTaskPaneStyle";
import { Verif } from "../utils/sigVerif";
import { decrypt } from "../utils/encryptDecrypt";
import { getBody } from "../utils/body";
import { getprivateKey } from "../utils/getprivatekey";

const DecryptTaskPane: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<JSX.Element | string>("");
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [attachmentsData, setAttachmentsData] = useState<any[]>([]); // Pour stocker les données des pièces jointes déchiffrées
  const [dialog, setDialog] = useState<any>(null); // Stocker l'instance de dialogue
  const styles = decryptTaskPaneStyle();

  const handleDecryption = async () => {
    try {
      const privateKey = await getprivateKey().catch(() => {
        Swal.fire("Erreur lors de la récupération de la clé privée.");
        return null;
      });

      if (!privateKey) {
        Swal.fire("Déchiffrement annulé ou clé privée non valide.");
        return;
      }

      const item = Office.context.mailbox.item;
      let booleanVerifAttach = [];
      let attachmentsData = []; // Créer un tableau pour stocker les détails des pièces jointes

      getBody(async (data) => {
        data = data.replace(/ /g, " "); // Remplacement d'espace insécable

        if (data.includes("BEGIN PKCS7")) {
          let decryptedBody = decrypt(data, privateKey);
          let body = decryptedBody.split("\n signature:\n");
          body.reverse();
          let sigCertBody = body[0].split("\n cert:\n");
          let booleanVerifBody = Verif(body[1], sigCertBody[1], sigCertBody[0]);

          // Vérification des pièces jointes
          if (item.attachments.length > 0) {
            const promises = item.attachments.map((attachment, index) => {
              return new Promise((resolve, reject) => {
                const options: Office.AsyncContextOptions = {
                  asyncContext: {
                    fileName: attachment.name,
                  },
                };

                item.getAttachmentContentAsync(attachment.id, options, (result) => {
                  if (result.status === Office.AsyncResultStatus.Succeeded) {
                    let content = atob(result.value.content);
                    let decryptedAttachment = atob(decrypt(content, privateKey));
                    let attachType = decryptedAttachment.split("\n type:\n")[1];
                    let attach = decryptedAttachment.split("\n type:\n")[0].split("\n signature:\n");
                    attach.reverse();
                    let sigCertAttach = attach[0].split("\n cert:\n");
                    booleanVerifAttach[index] = Verif(attach[1], sigCertAttach[1], sigCertAttach[0]);

                    let newFileName = result.asyncContext.fileName.split(".pkcs7")[0].replace("encrypted", "decrypted");

                    // Ajouter l'attachement déchiffré au tableau des pièces jointes
                    attachmentsData.push({
                      attachment: attach[1], // Contenu déchiffré
                      contentType: attachType, // Type de contenu
                      name: newFileName // Nouveau nom de la pièce jointe
                    });

                    resolve(undefined);
                  } else {
                    reject(result.error); // Rejeter si échec du déchiffrement
                  }
                });
              });
            });

            await Promise.all(promises);
          }

          // Vérification des signatures
          if (!booleanVerifAttach.includes(false) && booleanVerifBody === true) {
            Swal.fire({
              title: "Déchiffrement OK!",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              title: "Déchiffrement NOT OK!",
              icon: "error",
              timer: 1500,
              showConfirmButton: false,
            });
          }

          // Afficher la fenêtre de dialogue avec le corps du message et les pièces jointes
          const dialogUrl = `${window.location.origin}/dialog.html`;

          Office.context.ui.displayDialogAsync(
            dialogUrl,
            { height: 50, width: 50, displayInIframe: true, promptBeforeOpen: false },
            (asyncResult) => {
              if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                console.error(asyncResult.error.message);
              } else {
                const dialog = asyncResult.value;
                setDialog(dialog);

                setTimeout(() => {
                  const messageToDialog = JSON.stringify({
                    body: body[1], // Corps du message déchiffré
                    attachments: attachmentsData // Pièces jointes déchiffrées
                  });
                  dialog.messageChild(messageToDialog); // Envoyer les données au dialogue
                  console.log('Message et pièces jointes envoyés à la boîte de dialogue.');
                }, 1000);
              }
            }
          );
        }
      });
    } catch (error) {
      console.error("Erreur lors du déchiffrement:", error);
      Swal.fire("Une erreur est survenue lors du déchiffrement.");
    }
  };

  const handleVerifySignature = async () => {
    const privateKey = await getprivateKey();
    if (!privateKey) {
      Swal.fire("Vérification annulée ou clé privée non valide.");
      return;
    }

    const item = Office.context.mailbox.item;
    let booleanVerifAttach = [];
    let isBodyValid = false;

    getBody(async (data) => {
      data = data.replace(/ /g, " ");
      if (data.includes("BEGIN PKCS7")) {
        let decryptedBody = decrypt(data, privateKey);
        let body = decryptedBody.split("\n signature:\n");
        body.reverse();
        let sigCertBody = body[0].split("\n cert:\n");
        isBodyValid = Verif(body[1], sigCertBody[1], sigCertBody[0]);

        // Promise pour vérifier les pièces jointes
        const attachmentPromises = item.attachments.map((attachment, i) => {
          return new Promise((resolve) => {
            const options = {
              asyncContext: {
                fileName: attachment.name,
              },
            };

            item.getAttachmentContentAsync(attachment.id, options, (result) => {
              if (result.status === Office.AsyncResultStatus.Succeeded) {
                let content = atob(result.value.content);
                let decryptedAttachment = atob(decrypt(content, privateKey));
                let attachType = decryptedAttachment.split("\n type:\n")[1];
                let attach = decryptedAttachment.split("\n type:\n")[0].split("\n signature:\n");
                attach.reverse();
                let sigCertAttach = attach[0].split("\n cert:\n");
                booleanVerifAttach[i] = Verif(attach[1], sigCertAttach[1], sigCertAttach[0]);
                resolve(booleanVerifAttach[i]);
              } else {
                resolve(false); // Échec du téléchargement de la pièce jointe
              }
            });
          });
        });

        // Attendre que toutes les vérifications de pièces jointes soient terminées
        const results = await Promise.all(attachmentPromises);
        booleanVerifAttach = results;

        // Calculer la validité globale de la signature
        const isSignatureValid = !booleanVerifAttach.includes(false) && isBodyValid;

        // Mettre à jour directement le résultat
        setVerificationResult(
          isSignatureValid ? (
            <span>
              <CheckmarkCircle24Filled style={{ color: 'green', marginRight: '8px' }} />
              Signature valide
            </span>
          ) : (
            <span>
              <ErrorCircle24Filled style={{ color: 'red', marginRight: '8px' }} />
              Signature non valide
            </span>
          )
        );
      }
    });
  };

  useEffect(() => {
    const storedKey = window.localStorage.getItem("Key");
    if (storedKey) {
      setPrivateKey(storedKey);
    }
  }, []);

  return (
    <div className={styles.bodyContainer}>
      <h2 className={styles.titleTaskPane}>Déchiffrement de mail</h2>

      <form id="myform" className={styles.formContainer}>
        <label htmlFor="pkfile">Veuillez sélectionner votre clé privée pour déchiffrer ou vérifier la signature : </label>
        <input
          id="pkfile"
          type="file"
          className={styles.inputFile}
          onChange={async (event) => {
            const fileSelected = event.target.files;
            if (!fileSelected || fileSelected.length === 0) {
              Swal.fire("Aucun fichier sélectionné");
              return;
            }

            let read = new FileReader();
            read.readAsBinaryString(fileSelected[0]);
            read.onloadend = function () {
              let key = read.result;

              if (typeof key === "string" && !key.startsWith("-----BEGIN ENCRYPTED PRIVATE KEY")) {
                Swal.fire("Veuillez choisir une clé privée adéquate");
                return;
              }

              console.log(key);

              window.localStorage.setItem("Key", key as string);
              setPrivateKey(key as string);
              Swal.fire("Clé privée chargée avec succès");
            };
          }}
        />
      </form>

      {privateKey && (
        <p className={styles.keyParagraphe}>
          Votre clé privée est déjà téléchargée. Vous pouvez déchiffrer votre message ou vérifier la signature.
        </p>
      )}

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "decrypt" ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab("decrypt");
            handleDecryption();
          }}
        >
          Déchiffrer
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "verify" ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab("verify");
            handleVerifySignature();
          }}
        >
          Vérifier signature
        </button>
      </div>

      <div>
        {activeTab === "verify" && verificationResult && (
          <div>
            <h3>Résultat de la vérification :</h3>
            <p>{verificationResult}</p>
          </div>
        )}
      </div>

      <div>
        {activeTab === "decrypt" && attachmentsData.length > 0 && (
          <div>
            <h3>Pièces jointes déchiffrées :</h3>
            {attachmentsData.map((attachment, index) => (
              <p key={index}>
                {attachment.isValid ? (
                  <CheckmarkCircle24Filled style={{ color: 'green', marginRight: '8px' }} />
                ) : (
                  <ErrorCircle24Filled style={{ color: 'red', marginRight: '8px' }} />
                )}
                {attachment.name} - {attachment.isValid ? "Signature valide" : "Signature non valide"}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecryptTaskPane;
