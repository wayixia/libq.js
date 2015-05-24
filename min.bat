
set min_file=Q.min.1.0.js

rem combine files to min_file
copy src\Q.js+src\stl.js+src\tween.js+src\json2.js+src\ajax.js+src\drag.js+src\contextmenu.js+src\wndx-1-0-2.js+src\slider.js+src\checkbox.js+src\table.js+src\dropdownlist.js+src\simpleos.js+src\placeholder.js+src\tree.js+src\tabs.js+src\imagesbox.js %min_file% /B

rem compress
rem uglifyjs %min_file% -c -m -o %min_file% 

