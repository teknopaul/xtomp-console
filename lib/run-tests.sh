#!/bin/bash -e
#
# static code anylysis need more tests.
#

cd $(dirname $0)

failed=false
function failed() {
	failed=true
	echo $*
}

for js in *.js http_mods/*.js persistence/*.js util/*.js
do
	if [[ $js == util/date.js ]]
	then
		continue
	fi
	[[ "$1" == '-v' ]] && echo "jshint $js"
	jshint $js || failed "$js"
done

#
# Not really working but try to jshint browsers code anyway, ignore errors
#
cd view
echo '
var s = ' > .tmp-spacer.js
cat xtomp-console-controller.js \
  .tmp-spacer.js  \
  xtomp-console-view.js \
  .tmp-spacer.js  \
  xtomp-frame.js \
  .tmp-spacer.js  \
  xtomp-over-websockets.js \
   > ./.tmp.js

[[ "$1" == '-v' ]] && echo "jshint $js"
jshint ./.tmp.js
rm ./.tmp.js ./.tmp-spacer.js


cd ..

[[ "$1" == '-v' ]] && echo "test/test-xtomp-frame.js"
node test/test-xtomp-frame.js || "failed $js"

[ "$failed" == "false" ] && exit 0
