
call min.bat

rem compress
uglifyjs %min_file% -c -m -o %min_file% 

