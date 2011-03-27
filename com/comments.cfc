<cfcomponent>
	<cffunction name="getComments" access="remote" returntype="any">
		<cfargument name="target" type="string" required="yes">
		<cfhttp url="http://community.adobe.com/help/rss/comments.html" result="result">
			<cfhttpparam name="resource_id" type="url" value="http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/#arguments.target#">
			<cfhttpparam name="hl" type="url" value="en_US">
		</cfhttp>
		<cfscript>
			root = xmlparse(result.filecontent).rss.channel;
			items= xmlsearch(root,"item");
			comments = arraynew(1);
			for(i=1;i<=arraylen(items);i++) {
				description = replace(items[i].description.xmltext,'<','&lt;','all');
				description = replace(description,'>','&gt;','all');
				comment = {"description"=description,"pubdate"=dateformat(items[i].pubdate.xmltext,'mm.dd.yyyy'),"author"=items[i].author.xmltext};
				arrayappend(comments,comment);
			}
			return {"comments"=comments};
		</cfscript>
	</cffunction>
</cfcomponent>