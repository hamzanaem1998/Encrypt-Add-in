const forge = require("node-forge");

export class encDecSigVer {
  [x: string]: any;

  constructor(privateKey, publicKey, Message) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.Message = Message;
  }

  public decrypt(encryptedData: string) {
    var p7d = forge.pkcs7.messageFromPem(encryptedData);
    p7d.decrypt(p7d.recipients[0], this.privateKey);
    return p7d.content.data;
  }

  public encrypt() {
    // create cert object
    var cert = forge.pki.certificateFromPem(this.publicKey);
    // create envelop data
    var p7 = forge.pkcs7.createEnvelopedData();
    // add certificate as recipient
    p7.addRecipient(cert);
    // set content
    p7.content = forge.util.createBuffer();
    p7.content.putString(this.Message);

    // encrypt
    p7.encrypt();

    // obtain encrypted data with DER format
    var str = forge.pkcs7.messageToPem(p7);

    return str;
  }

  public sign(pem: string) {
    var md = forge.md.sha256.create();
    md.update(this.Message, "utf8");
    var pss = forge.pss.create({
      md: forge.md.sha256.create(),
      mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
      saltLength: 20,
      // optionally pass 'prng' with a custom PRNG implementation
      // optionalls pass 'salt' with a forge.util.ByteBuffer w/custom salt
    });
    var privateKey = forge.pki.privateKeyFromPem(pem);
    var signature = privateKey.sign(md, pss);
    var encoded = forge.util.encode64(signature);
    return encoded;
  }

  public Verif(pem: string, signature: string) {
    var str = forge.util.decode64(signature);
    var pss = forge.pss.create({
      md: forge.md.sha256.create(),
      mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
      saltLength: 20,
      // optionally pass 'prng' with a custom PRNG implementation
    });
    var md = forge.md.sha256.create();
    md.update(this.Message, "utf8");
    var cert = forge.pki.certificateFromPem(pem);
    var bol = cert.publicKey.verify(md.digest().getBytes(), str, pss);
    return bol;
  }
}

export function decrypt(encryptedData: string, privateKey) {
  var p7d = forge.pkcs7.messageFromPem(encryptedData);
  p7d.decrypt(p7d.recipients[0], privateKey);
  return p7d.content.data;
}

export function encrypt(data: string, pubKey: string) {
  // create cert object
  var cert = forge.pki.certificateFromPem(pubKey);
  // create envelop data
  var p7 = forge.pkcs7.createEnvelopedData();
  // add certificate as recipient
  p7.addRecipient(cert);
  // set content
  p7.content = forge.util.createBuffer();
  p7.content.putString(data);

  // encrypt
  p7.encrypt();

  // obtain encrypted data with DER format
  var str = forge.pkcs7.messageToPem(p7);

  return str;
}
