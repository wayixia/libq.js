
set min_file=Q.min.js
set debug_file=Q.debug.js

rem combine files to min_file
copy src\Q.js+src\stl.js+src\tween.js+src\json2.js+src\ajax.js+src\drag.js+src\contextmenu.js+src\wndx-1-0-2.js+src\slider.js+src\checkbox.js+src\table.js+src\dropdownlist.js+src\simpleos.js+src\placeholder.js+src\tree.js+src\tabs.js+src\imagesbox.js+src\calendar.js+src\xml.js+src\calendar.js+src\dropwindow.js %debug_file% /B


