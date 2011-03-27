<cfcomponent>
	<cffunction name="compilePages" access="public" returntype="void">
		<cfset links = application.toc.gettoc()>
		<cfset allkeys = arraynew(1)>
		<cfloop collection="#links#" item="key">
			<cfset arrayappend(allkeys,key)>
		</cfloop>
		<cfloop from="2" to="#arraylen(allkeys)#" index="i">
			<cfset key = allkeys[i]>
			<cfset content = application.parser.getPage(title=links[key].title,target=links[key].href).content>
			<cfset path = replacenocase(links[key].href,'http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/','','all')>
			<cfset path = links[key].href>
			<cfthread action="run" name="thread#i#" content="#content#" path="#path#">
				<cffile action="write" 
						file="#expandpath("content/")##attributes.path#" 
						nameconflict="overwrite" 
						output="#attributes.content#" 
						charset="utf-8" />
			</cfthread>
		</cfloop>
	</cffunction>
</cfcomponent>