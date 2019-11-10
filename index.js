const AWS = require('aws-sdk');
const fs = require('fs');
const checksum = require('checksum');

const FILE_NAME = process.argv[2] || null;
const ID = process.env.AWS_ACCESS_KEY_ID || "";
const SECRET = process.env.AWS_SECRET_ACCESS_KEY || "";
const BUCKET_NAME = 'test-electron';


const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

const uploadFile = (fileName, version) => {
	if(FILE_NAME == null){
		throw "ERROR: No se ha especificado un nombre de archivo";
	}


    const fileContent = fs.readFileSync(fileName);

	// <-- SUBIR ARCHIVO latest.json A S3 -->
    console.log(`[+] Generando el archivo latest.json...`);
    var latest = {
    	file_name: fileName,
    	version: version,
    	checksum: checksum(fileContent),
    	last_mod: Date.now()
    }

    params = {
        Bucket: BUCKET_NAME,
        Key: 'latest.json', // File name you want to save as in S3
        Body: JSON.stringify(latest)
    };

    console.log(`[+] Subiendo < latest.json > a S3...`);
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`Archivo subido con exito < ${data.Location} >`);
    });
    // <-- SUBIR ARCHIVO latest.json A S3 -->

	// <-- SUBIR ARCHIVO A S3 -->

    var params = {
        Bucket: BUCKET_NAME,
        Key: fileName, // File name you want to save as in S3
        Body: fileContent
    };

    console.log(`[+] Subiendo < ${fileName} > a S3...`);
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`Archivo subido con exito < ${data.Location} >`);
    });
    // <-- SUBIR ARCHIVO A S3 -->
};

const checkUpdate = (version) => {
	// <-- COMPROBAR ACTUALIZACIONES -->
	var params = {
		Bucket: BUCKET_NAME,
		Key: 'latest.json'
	};

	console.log(`[+] Comprobando actualizaciones`);

	var stream = s3.getObject(params).createReadStream();

	var latest = '';
	stream.on('data',function(data){
	  latest += data.toString();
	});

	stream.on('end',function(){
		latest = JSON.parse(latest);
		if (latest.version > version) {
			
			LATEST = latest;

			console.log("[*] ------- Actualizacion disponible");
			console.log(`[*] ------- ${latest.file_name}`)

			downloadFile(latest);
		}else{
			console.log("[*] ------- No hay actualizaciones disponibles")
		}
	});
	// <-- COMPROBAR ACTUALIZACIONES -->
}

const downloadFile = (latest) => {
	var fileName = latest.file_name;
	var params = {
		Bucket: BUCKET_NAME,
		Key: fileName
	};
	console.log(`[+] Descargando ${fileName} de S3...`);
	var file = fs.createWriteStream(`tmp/${fileName}`);
	s3.getObject(params).createReadStream().pipe(file);
	console.log('[+] Comprobando CheckSum..');

	const fileContent = fs.readFileSync(fileName);

	if (checksum(fileContent) == latest.checksum) {
	     console.log('[*] -------> OK');
	}else{
		 console.log('[*] -------> ERR');
	}
}

//uploadFile(FILE_NAME,"1.0.0")
checkUpdate("0.0.1");
