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
    //console.log(results);
});

function spellcheck(file,data){
    console.log(file);
    stringcheck(data);
    commentCheck(data)
}
function stringcheck(data){
    var matches = data.match(/(?:\"(.+?)\")|(?:\'(.+?)\')/g);
    stringRule(matches);
}
function commentCheck(data){
    var matches = data.match(/(\/\/.*?\n)|(\/\*[\s\S]+?\*\/)/g);
    rule(matches);
}
function stringRule(matches){
    if(!Array.isArray(matches)) return;
    var ml = matches.length;
    for(var i=0;i < ml;i++){
        var item = matches[i];
        item = item.split(/\s+/);
        var il = item.length;
        for(var j=0;j<il;j++){
            var word = item[j];
            word = word.replace(/\'|\"/g,'');
            word = word.replace(/[^a-zA-Z0-9]{1}?$/,'');
            //Star star stars
            word = word.toLowerCase();
            if(item[j].match(/(?:^[a-z]+$)|(?:^[A-Z][a-z]+$)/) &&  !dict[word] && !dict[word+'s']){                
              console.log(item[j]);
            }
        }
    }
}
function rule(matches){
    if(!Array.isArray(matches)) return;
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
                // ignore A-Z 
                if( !/[A-Z]/.test(item) &&!dict[litem] && !dict[litem+'s']){
                  console.log(item);
                }
                // 
              }
            }
        }
    }
}
