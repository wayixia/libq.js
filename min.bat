
set min_file=Q.min.js

rem combine files to min_file
copy Q.js+utils\stl.js+utils\tween.js+utils\ajax.js+ui\drag.js+ui\contextmenu.js+ui\wndx-1-0-2.js %min_file% /B

rem compress
uglifyjs %min_file% -c -m -o %min_file% 

