#!/bin/bash -e
#
# Build the .deb package
#
if [ `id -u` != "0" ]
then
    sudo $0
    exit $?
fi

#
# The package name
#
NAME=xtomp-console
ARCH=`uname -m`

#
# Select the files to include
#
cd `dirname $0`/..
PROJECT_ROOT=`pwd`

#
# Copy files
#
mkdir -p ${PROJECT_ROOT}/deploy/root/usr/local/xtomp-console/
mkdir -p ${PROJECT_ROOT}/deploy/root/lib/systemd/system/
mkdir -p ${PROJECT_ROOT}/deploy/root/var/log/xtomp/

cp --archive bin/ lib/ ${PROJECT_ROOT}/deploy/root/usr/local/xtomp-console


cp script/xtomp-console.service ${PROJECT_ROOT}/deploy/root/lib/systemd/system/
touch ${PROJECT_ROOT}/deploy/root/var/log/xtomp/console.log
# TODO cp objs/xtomp-console.8 ${PROJECT_ROOT}/deploy/root/usr/share/man/man8/

xc_dir=${PROJECT_ROOT}/deploy/root/usr/local/xtomp-console
rm -rf $xc_dir/lib/{test,run-test.sh} $xc_dir/lib/node_modules/stomp/{docs,examples} $xc_dir/lib/node_modules/async-limiter/coverage/


FILES=${PROJECT_ROOT}/deploy/root

#
# Create a temporary build directory
#
TMP_DIR=/tmp/${NAME}_debbuild
rm -rf ${TMP_DIR}
mkdir -p ${TMP_DIR}
. ./version
sed -e "s/@PACKAGE_VERSION@/${VERSION}/" ${PROJECT_ROOT}/deploy/DEBIAN/control.in > ${PROJECT_ROOT}/deploy/DEBIAN/control
cp --archive -R ${FILES}/* ${TMP_DIR}/

SIZE=$(du -sk ${TMP_DIR} | cut -f 1)
sed -i -e "s/@SIZE@/${SIZE}/" ${PROJECT_ROOT}/deploy/DEBIAN/control

cp --archive -R ${PROJECT_ROOT}/deploy/DEBIAN ${TMP_DIR}/

#
# Setup the installation package ownership here if it needs root
#
chown root.root ${TMP_DIR}/*
chmod +x ${TMP_DIR}/usr/local/xtomp-console/bin/*
chmod +w ${TMP_DIR}/var/log/xtomp/ ${TMP_DIR}/var/log/xtomp/*

#
# Build the .deb
#
dpkg-deb --build ${TMP_DIR} ${NAME}-${VERSION}-1.${ARCH}.deb

mkdir -p ./target
mv ${NAME}-${VERSION}-1.${ARCH}.deb ./target

chown -R "$SUDO_USER" ./target

echo "built ./target/${NAME}-${VERSION}-1.${ARCH}.deb"

deploy/build-console.sh
