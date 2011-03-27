<cfcomponent>
	<cffunction name="init" access="public" returntype="any">
		<cfset variables.tocpath = "http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/toc.js">
		<cfset variables.toc = parseTOC(path=variables.tocpath)>
		<cfreturn this>
	</cffunction>
	
	<cffunction name="getTOC" access="public" returntype="struct">
		<cfreturn variables.toc>
	</cffunction>
	
	<cffunction name="parseTOC" access="private" returntype="struct">
		<cfargument name="path" required="yes" type="string" default="#variables.tocpath#">
		<cfhttp url="http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/toc.js" result="docs"></cfhttp>
		<cfset regex = "var dataObjWS.*?\);">
		<cfset str = tostring(docs.filecontent)>
		<cfset jre = CreateObject("component","jre-utils").init(DefaultFlags='CASE_INSENSITIVE,DOTALL',BackslashReferences=false)/>
		<cfset toc = jre.match(regex="(var dataObjWS).*?(\);$?)",text=trim(str))>
		<cfset links = createobject("java", "java.util.LinkedHashMap").init()>
		<cfset links['0_0'] = {"title"="#application.roottitle#","href"="#application.rootpage#","parent"="root","key"="0_0","sortorder"=0,"parenttarget"=""}>
		<cfloop from="1" to="#arraylen(toc)#" index="i">
			<cfset key = replace(jre.match('var WS.*?html',toc[i])[1],"var ","","all")>
			<cfset href = ''>
			<cfset titlematch 	= '(?:label: ")(.*?)(?=",)'>
			<cfset hrefmatch 	= '(?:href:")(.*?)(?=")'>
			<cfset pathmatch	= '(?:html, )(.*?)(?=, false)'>
			<cfset parent	= replace(jre.match(pathmatch,toc[i])[1],'html, ','','all')>
			<cfif trim(parent) neq "root">
				<cfset parenttarget = links[trim(parent)].href>
			<cfelse>
				<cfset parenttarget = ''>
			</cfif>
			<cfset title	= replace(jre.match(titlematch,toc[i])[1],'label: "','','all')>
			<cfset title 	= replace(title,'\','','all')>
			<cfset href		= replace(jre.match(hrefmatch,toc[i])[1],'href:"','','all')>
			<cfset links[key] = {"title"=trim(title),"href"=trim(href),"parent"=trim(parent),"key"=trim(key),"sortorder"=i,"parenttarget"=parenttarget}> 
		</cfloop>
		<cfreturn links>
	</cffunction>
</cfcomponent>