@echo off
cd clientjs
rem call browserify jsHarmony.js | uglifyjs > ..\public\js\jsHarmony.js
rem call browserify jsHarmony.js > ..\public\js\jsHarmony.js
supervisor  -n exit -w ".","..\node_modules\jsharmony-validate" -e js -x browserify.cmd -- jsHarmony.js -o ..\public\js\jsHarmony.js
cd ..