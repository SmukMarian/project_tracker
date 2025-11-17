; NSIS installer script for Haier Project Tracker
; Usage (from repository root): makensis /DVERSION=0.1.0 /DAPP_EXE=dist\haier-project-tracker.exe /DOUTPUT=dist\HaierProjectTracker-Setup.exe packaging\installer.nsi

!include "MUI2.nsh"

!ifndef VERSION
!define VERSION "0.1.0"
!endif

!ifndef APP_EXE
!define APP_EXE "dist\haier-project-tracker.exe"
!endif

!ifndef OUTPUT
!define OUTPUT "dist\HaierProjectTracker-Setup-${VERSION}.exe"
!endif

!define PRODUCT_NAME "Haier Project Tracker"
!define COMPANY "Haier"
!define INSTALLDIR "$PROGRAMFILES\${PRODUCT_NAME}"

Name "${PRODUCT_NAME} ${VERSION}"
OutFile "${OUTPUT}"
InstallDir "${INSTALLDIR}"
RequestExecutionLevel user

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "Russian"

Section "Install"
  SetOutPath "$INSTDIR"
  File "${APP_EXE}"
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\haier-project-tracker.exe"
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\haier-project-tracker.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\haier-project-tracker.exe"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir "$INSTDIR"
SectionEnd
