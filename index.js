
import * as yo from 'yeoman-environment';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import archiver from 'archiver'
import fs from 'fs'



const app = express();
app.use(cors(), bodyParser.json());

const basePath = 'C:\\Workspace\\Javascript\\YoGenAPI\\';

const generators = [{
    id: 1,
    name: 'java-basic-2',
    args: [
            {name:'projectTitle', prompt: 'Enter the name of the project', type: 'input', order: 1 },
            {name:'namespace', prompt: 'Enter the namespace for this project:', type: 'input', order: 2 }
        ],
    // args2: ['projectTitle', 'namespace'],
    path: 'C:\\Workspace\\Javascript\\ADCBTemplateGenerator\\test\\generator-java-basic-2\\generators\\app',
    nameSpace: 'java-basic-2:app',
    technology: 'java'
},
{
    id: 2,
    name: 'csharp-basic',
    args: [
            {name:'projectTitle', prompt: 'Enter the name of the project', type: 'input', order: 1 },
            {name:'namespace', prompt: 'Enter the namespace for this project:', type: 'input', order: 2 }
        ],
    // args2: ['projectTitle', 'namespace'],
    path: 'C:\\Workspace\\Javascript\\ADCBTemplateGenerator\\test\\generator-java-basic-2\\generators\\app',
    nameSpace: 'java-basic-2:app',
    technology: 'csharp'
}]



app.get('/technology', (req, res) => {
    let distinctTechnology = generators
                    .map(p => p.technology )

    distinctTechnology = [...new Set(distinctTechnology)];

    res.json(distinctTechnology);
});


app.get('/getGeneratorByName/:name', (req, res) => {
    let genName = req.params.name;
    let gen = generators.find(p => p.name === genName);

    if (gen) {
        res.json(gen.args);
    } else {
        res.status(404).send('Generator not found');
    }
});

app.get('/getAllGenerators/:technology', (req, res) => {
    let gens = generators   
                    .filter(f => f.technology === req.params.technology)
                    .map(p => p.name );

    res.json(gens);
});


 app.post('/submit', async (req, res) => {
    const { name, args } = req.body;
    
    let resp = await runGenerator(name, args);
    if(resp){

        await zipDirectory(basePath + resp, basePath + resp + '.zip');
        
        res
        .status(200)
        .sendFile(basePath + resp + '.zip');
        // res.status(200).send('Template has been generated');
    }
    else{
        res.status(500).send('Error');
    }
})

async function runGenerator(name, args) {
    let {path, nameSpace} = generators.find(p => p.name === name);
    let orderedArgs = args
                        .sort((a,b) => a.order - b.order)
                        .map(m => m.value);
    console.log('Ordered Args:', orderedArgs);
    var env = yo.createEnv();
    env.register(path, nameSpace);
    await env.run([nameSpace, ...orderedArgs]);
    return orderedArgs[0];
}

function zipDirectory(sourceDir, outPath) {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(outPath);
  
    return new Promise((resolve, reject) => {
      archive
        .directory(sourceDir, false)
        .on('error', err => reject(err))
        .pipe(stream)
      ;
  
      stream.on('close', () => resolve());
      archive.finalize();
    });
  }


async function zipDirectory2(name){
    const outputFilePath =  name + '.zip';
    // Create a writable stream for the zip file
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip');

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err;
    }
    });
    
    archive.on('error', function(err){
        throw err;
    });

    // Pipe the output stream to the archive
    archive.pipe(output);
    // Append all files in the directory to the archive
    archive.directory( './' + name, false);
    // Finalize the archive (write the zip file)
    archive.finalize();
    
    // Handle events
    output.on('close', () => {
    console.log('Zip file created:', outputFilePath);
    });
    archive.on('error', (err) => {
    console.error('Error creating zip file:', err);
    });
}





// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Yo! Server is listening on port ${port}`));