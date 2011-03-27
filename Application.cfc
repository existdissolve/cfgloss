<cfcomponent output="false">
    <cfscript>
        this.name = "ColdFusion Documentation";
        this.applicationTimeout = CreateTimeSpan(2,0,0,0);
    </cfscript>
    <cffunction name="onApplicationStart" output="false" returntype="void">
        <cfscript>
			application.rootpage = "index.html";
			application.roottitle= "About this App";
			tocObj = createobject("component","com.toc").init();
			parserObj = createobject("component","com.parser");
			application.parser = parserObj;
			application.toc = tocObj;
			application.uselocal = true;
			application.localpath = "http://localhost:8888/gloss/index.cfm";
			application.docspath = "http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/";
			if(application.uselocal) {
				application.urlpath = "http://example.com/content/";
				application.rootpath = application.localpath;
			}
			else {
				application.urlpath = application.docspath;
				application.rootpath = application.docspath;
			} 
        </cfscript>    
    </cffunction>
</cfcomponent>