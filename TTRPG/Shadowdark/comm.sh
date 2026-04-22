(
	head -3 chargen.template.html ; 

	echo "<script defer>"
	cat chargen.mjs; 
	echo "</script>"


	echo "<script defer> console.log('loaded #2');"
	sed 1d pageglue.mjs; 
	echo "</script>"

	sed 1,6d chargen.template.html;
) > chargen.html
