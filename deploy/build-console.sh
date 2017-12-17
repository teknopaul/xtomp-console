#!/bin/bash -e
#
# build the xtomp-console package as a tar.gz & tar.xz
#
if [ `id -u` != "0" ]
then
    sudo $0
    exit $?
fi

cd $(dirname $0)/..

mkdir -p ./tmp ./target

if [ -d ./tmp/xtomp-console-* ]
then
  rm -r ./tmp/xtomp-console-*
fi

. ./version

mkdir -p ./tmp/xtomp-console-$VERSION
cp --archive bin/ lib/ ./tmp/xtomp-console-$VERSION/
xc_dir=./tmp/xtomp-console-$VERSION
rm -rf $xc_dir/lib/{test,run-test.sh} $xc_dir/lib/node_modules/stomp/{docs,examples} $xc_dir/lib/node_modules/async-limiter/coverage/

chown -R root.root ./tmp/xtomp-console-$VERSION

(cd ./tmp && tar -c -z -f xtomp-console-$VERSION.tar.gz xtomp-console-$VERSION)
(cd ./tmp && tar -c -J -f xtomp-console-$VERSION.tar.xz xtomp-console-$VERSION)

mv ./tmp/xtomp-console-$VERSION.tar.* ./target/

chown -R "$SUDO_USER" ./target ./tmp

echo "built " ./target/xtomp-console-$VERSION.tar.*

rm -r ./tmp