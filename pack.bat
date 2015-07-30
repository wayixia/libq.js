
call min.bat

rem compress
uglifyjs %debug_file% -c -m -o %min_file% 

