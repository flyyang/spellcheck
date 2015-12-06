#! /usr/bin/env node

var fs = require('fs');
var program = require('commander');
var path = require('path');

program
    .version('0.0.1')
    .option('-d, --directory <path>','project directory') 
    .option('-t, --type <type>','check type') 
    .option('-r, --recursive <recursive>','recursive') 
    .option('-f, --file <file>','show file') 
    .parse(process.argv);

var directory = program.directory;
var type = program.type;

if(!directory || !type){
    program.help();
}


// English dict from 
// https://github.com/first20hours/google-10000-english/blob/master/google-10000-english.txt
var dictstring = fs.readFileSync('./English.dic','utf-8');
var dict = {};
var dictarr = dictstring.split('\n');
var dl = dictarr.length;

for(var i=0;i < dl;i++){
    if(dictarr[i]){
        dict[dictarr[i]] = 1;
    }
}
var walk = function(dir,type,done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                var fileregex = new RegExp('.'+type+'$');
                if (stat.isDirectory()) {
                    if(/node_modules/.test(file)) return;
                    walk(file, type, function(err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    if(fileregex.test(file)){
                      results.push(file);
                      fs.readFile(file,'utf-8', function(err, data) {
                          if(err) throw err;
                          spellcheck(file,data);      
                      })
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};

walk(directory, type, function(err, results) {
    if (err) throw err;
});

function spellcheck(file,data){
    var matches = /(\/\/.+\n)|(\/\*[\s\S]+?\*\/)/.exec(data);
    //console.log(matches);
    if(matches && matches.length > 0){
        var ml = matches.length;
        for (var i=0 ; i < ml;i++) {
            if(!matches[i]) return;
            var comment = matches[i].replace('\n','').split(/\s+/);
            //console.log(comment);
           
            if(comment && comment.length > 0){
                var cl = comment.length; 
                //console.log(cl);
                for(var j=0;j < cl;j++){
                  //console.log(comment[j]);
                  var item = comment[j];
                  if(/^[a-zA-Z]+$/.test(item)){
                    var litem = item.toLowerCase();
                    // not over two cap letters, or leading with capital letter
                    if(!/[A-Z]+.*[A-Z]+.*/.test(item) && /[^A-Z]/.test(item) &&!dict[litem]){
                      if(program.file){
                        console.log(file);
                      }
                      console.log(item);
                    }
                    // 
                  }
                }
            }
        }
    }
}
