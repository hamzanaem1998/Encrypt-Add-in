//import Swal from "sweetalert2";
const Swal = require("sweetalert2");
const pki = require("node-forge").pki;

export async function getprivateKey() {
  const fileKey = window.localStorage.getItem("Key");
  let privateKey: any;

  if (fileKey) {
    // Utilisation d'une promesse pour obtenir la passphrase
    const { value: passphrase } = await Swal.fire({
      title: "Entrez la passphrase:",
      input: "password",
      inputAttributes: {
        maxlength: "20",
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
    });

    if (passphrase) {
      try {
        privateKey = pki.decryptRsaPrivateKey(fileKey, passphrase);
        if (!privateKey) {
          throw new Error("Passphrase incorrecte ou clé privée invalide.");
        }
        window.localStorage.setItem("passKey", passphrase); // Stocker la passphrase
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Passphrase incorrecte ou clé privée invalide.",
        });
        return null;
      }
    } else {
      // Si l'utilisateur annule l'entrée de la passphrase
      Swal.fire("Veuillez saisir une passphrase valide.");
      return null;
    }
  } else {
    Swal.fire("Veuillez sélectionner une clé privée.");
    return null;
  }

  return privateKey;
}


