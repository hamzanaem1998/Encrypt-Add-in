import React, { useEffect, useState, useRef } from "react";
import { Button } from '@fluentui/react-components';
import Swal from "sweetalert2";
import { getprivateKey } from "../utils/getprivatekey";
import { getBody, setBody } from "../utils/body";
import { getcertemail } from "../utils/getEmail";
import { sign } from "../utils/sigVerif";
import { encrypt } from "../utils/encryptDecrypt";
import { getAttachmentsCallback } from "../utils/attachmentsHandler";
import encryptTaskPaneStyle from "../styles/encryptTaskPaneStyle";
const pki = require("node-forge").pki;

const EncryptTaskPane: React.FC = () => {
    const styles = encryptTaskPaneStyle();
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const pkfileInput = useRef<HTMLInputElement | null>(null); // reference for input element

    // Fonction pour gérer la sélection du fichier de clé privée
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileSelected = e.target.files;
        if (fileSelected && fileSelected.length > 0) {
            const reader = new FileReader();
            reader.readAsBinaryString(fileSelected[0]);
            reader.onloadend = () => {
                const key = reader.result as string;
                if (!key.startsWith("-----BEGIN ENCRYPTED PRIVATE KEY")) {
                    Swal.fire("Veuillez choisir une clé privée adéquate");
                    return;
                }
                window.localStorage.setItem("Key", key);
                setPrivateKey(key); // Mise à jour de la clé privée dans l'état
            };
        }
    };

    // Soumission du formulaire : Chiffrement et signature
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // Récupérer la clé privée (cela déclenchera la popup pour la passphrase)
        const pemKey = await getprivateKey();
    
        // Si la clé privée est invalide ou l'utilisateur a annulé
        if (!pemKey) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Clé privée invalide ou mot de passe incorrect!",
            });
            return;
        }
    
        const pem = pki.privateKeyToPem(pemKey); // Conversion de la clé privée au format PEM
        const item = Office.context.mailbox.item;
        const pubkey = await getcertemail(item); // Récupération de la clé publique associée à l'email
        const options = { asyncContext: { currentItem: item, pub_key: pubkey, privateKey: pemKey } };
    
        getBody((data) => {
            const signed = sign(data, pem);
            const toencdata = `${data}\n signature:\n${signed}\n cert:\n${pubkey}`;
            if (!data.replace(/ /g, " ").includes("BEGIN PKCS7")) {
                setBody(encrypt(toencdata, pubkey), () => console.log("Encryption completed"));
                item.getAttachmentsAsync(options, getAttachmentsCallback);
            }
        });
    };
    
    // Effet de mise à jour : Vérifier si une clé privée est déjà stockée localement
    useEffect(() => {
        if (window.localStorage.getItem("Key")) {
            setPrivateKey(window.localStorage.getItem("Key"));
        }
    }, []);

    return (
        <div className={styles.bodyContainer}>
            <main>
                <h2 className={styles.titleTaskPane}>Chiffrement de mail</h2>

                <form id="myform" onSubmit={handleSubmit} className={styles.formContainer}>
                    <label htmlFor="pkfile">Afin de signer et chiffrer votre message, veuillez sélectionner votre clé privée :</label>
                    <input
                        id="pkfile"
                        type="file"
                        onChange={handleFileChange}
                        ref={pkfileInput}
                        className={styles.inputFile}
                    />
                    <Button appearance="primary" type="submit" className={styles.chiffrerButton}>Chiffrer</Button>
                </form>
                {privateKey && (
                    <p className={styles.keyParagraphe}>
                        Votre clé privée est déjà téléchargée. Cliquez sur "Chiffrer" pour signer et chiffrer
                        votre message, ou sélectionnez une nouvelle clé privée si nécessaire.
                    </p>
                )}
            </main>
        </div>
    );
};

export default EncryptTaskPane;
