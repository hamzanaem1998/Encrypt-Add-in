import React, { useState } from "react";
import { CheckmarkCircle24Filled, ErrorCircle24Filled } from '@fluentui/react-icons';
import Swal from "sweetalert2";
import decryptTaskPaneStyle from "../styles/decryptTaskPaneStyle";
import { Verif } from "../utils/sigVerif";
import { decrypt } from "../utils/encryptDecrypt";
import { getBody } from "../utils/body";
import { getprivateKey } from "../utils/getprivatekey";

const DecryptTaskPane: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>(null); // Aucun onglet sélectionné par défaut
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null); // Message déchiffré
  // const [verificationResult, setVerificationResult] = useState<string | null>(null); // Résultat de la vérification de signature
  const [verificationResult, setVerificationResult] = useState<JSX.Element | string>("");
  const styles = decryptTaskPaneStyle();

  // Fonction pour gérer le déchiffrement
  const handleDecrypt = async () => {
    console.log("Déchiffrement déclenché");

    // Récupérer la clé privée déchiffrée avec la passphrase
    const privateKey = await getprivateKey();
    if (!privateKey) {
      // Si la clé privée n'est pas disponible ou la passphrase est incorrecte
      Swal.fire("Déchiffrement annulé ou clé privée non valide.");
      return;
    }

    getBody(async (data) => {
      data = data.replace(/ /g, " ");

      let decryptedBody = decrypt(data, privateKey);
      let body = decryptedBody.split("\n signature:\n");
      console.log(body[0]);
      console.log(typeof (body));
      body.reverse();
      let sigCertbody = body[0].split("\n cert:\n");
      let bol1 = Verif(body[1], sigCertbody[1], sigCertbody[0]);
      console.log("res signature : " + bol1);

      setDecryptedMessage(decryptedBody);
      Swal.fire("Message déchiffré avec succès.");
    });
  };

  // Fonction pour gérer la vérification de signature
  const handleVerifySignature = async () => {
    console.log("Vérification de signature déclenchée");

    // Récupérer la clé privée déchiffrée avec la passphrase
    const privateKey = await getprivateKey();
    if (!privateKey) {
      // Si la clé privée n'est pas disponible ou la passphrase est incorrecte
      Swal.fire("Vérification annulée ou clé privée non valide.");
      return;
    }


    getBody(async (data) => {
      data = data.replace(/ /g, " ");
      let decryptedBody = decrypt(data, privateKey); // Déchiffrement avec la clé privée
      let bodyParts = decryptedBody.split("\n signature:\n");
      bodyParts.reverse();
      let sigCertBody = bodyParts[0].split("\n cert:\n");

      // Vérification de la signature
      let isValid = Verif(bodyParts[1], sigCertBody[1], sigCertBody[0]);

      // Mise à jour du résultat avec une icône en fonction de la validité de la signature
      setVerificationResult(
        isValid ? (
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
    });

  };

  return (
    <div className={styles.bodyContainer}>
      <h2 className={styles.titleTaskPane}>Déchiffrement de mail</h2>

      <form id="myform" className={styles.formContainer}>
        <label htmlFor="pkfile"> Afin de déchiffrer votre mail ou vérifier la signature, veuillez sélectionner votre clé privée: </label>
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

              window.localStorage.setItem("Key", key as string);
              Swal.fire("Clé privée chargée avec succès");
            };
          }}
        />
      </form>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "decrypt" ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab("decrypt");
            // console.log("Onglet Déchiffrer sélectionné"); // Vérifier si l'onglet est bien sélectionné
            handleDecrypt(); // Appel de la fonction de déchiffrement
          }}
        >
          Déchiffrer
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "verify" ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab("verify");
            // console.log("Onglet Vérifier signature sélectionné"); // Vérifier si l'onglet est bien sélectionné
            handleVerifySignature(); // Appel de la fonction de vérification de signature
          }}
        >
          Vérifier signature
        </button>
      </div>

      <div>
        {activeTab === "decrypt" && decryptedMessage && (
          <div>
            <h3>Message déchiffré :</h3>
            <p>{decryptedMessage}</p>
          </div>
        )}
        {activeTab === "verify" && verificationResult && (
          <div>
            <h3>Résultat de la vérification :</h3>
            <p>{verificationResult}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecryptTaskPane;
