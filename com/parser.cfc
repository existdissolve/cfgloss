<cfcomponent>
	<cffunction name="init" access="public" returntype="any">
		<cfset variables.tocpath = "http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/toc.js">
		<cfset variables.toc = parseTOC(path=variables.tocpath)>
		<cfreturn this>
	</cffunction>
	
	<cffunction name="getTOC" access="public" returntype="struct">
		<cfreturn variables.toc>
	</cffunction>
	
	<cffunction name="getNavigation" access="public" returntype="any">
		<cfargument name="root" required="yes" type="string">		
		<cfset var i = 1>
		<cfset var thisitem = structfindkey(variables.toc,arguments.root,"all")[1]>
		<cfset var str =  "<li>#thisitem.value.title#">
		<!---get children for current level--->
		<cfset var children = structfindvalue(variables.toc,arguments.root,"all")>		
		
		<cfif arraylen(children) gt 1>
			<cfset str = str & "<ul>">
			<cfloop from="1" to="#arraylen(children)#" index="i">
				<cfif children[i].owner.key neq arguments.root>
					<cfif isstruct(children[i])>
						<cfset str = str & getnavigation(root=children[i].owner.key)>
					</cfif>
				</cfif>
			</cfloop>
			<cfset str = str & "</ul>">
		</cfif>
		<cfset str = str & "</li>">
		<cfreturn str>
	</cffunction>
	
	<cffunction name="getNavigationSection" access="public" returntype="string">
		<cfargument name="root" required="yes" type="string" default="root">
		<cfset navitems = structfindvalue(variables.toc,arguments.root,"all")>
		<cfset str = "">
		<cfif arraylen(navitems)>
			<cfloop from="1" to="#arraylen(navitems)#" index="i">
				<cfif navitems[i].owner.parent eq arguments.root>
					<cfset str = str & "<li>#navitems[i].owner.title#</li>">
				</cfif>
			</cfloop>
		</cfif>
		<cfreturn str />
	</cffunction>
	
	<cffunction name="getNavigationSectionAJAX" access="remote" returntype="any">
		<cfargument name="node" required="yes" type="string" default="root">
		<cfset navitems = structfindvalue(application.toc.getTOC(),arguments.node,"all")>
		<cfset result = arraynew(1)>
		<cfif arraylen(navitems)>
			<cfloop from="1" to="#arraylen(navitems)#" index="i">
				<cfif navitems[i].owner.parent eq arguments.node>
					<cfset key = navitems[i].owner.key>
					<cfset leaf = nodeIsTerminal(key)>
					<cfset item = {"text"="#navitems[i].owner.title#","title"="#navitems[i].owner.title#","id"="#navitems[i].owner.key#","cls"="list-item","iconCls"="no-icon","leaf"=leaf,"target"="#navitems[i].owner.href#"}>
					<cfset arrayappend(result,item)>
				</cfif>
			</cfloop>
		</cfif>
		<cfreturn result />
	</cffunction>
	
	<cffunction name="getPageID" access="remote" returntype="any">
		<cfargument name="identifier" required="true" type="string">
		<cfargument name="target" required="true" type="string">
		<cfset arguments.target = rereplacenocase(arguments.target,'##.*','','all')>
		<cfset node = structfindvalue(application.toc.getTOC(),arguments.target,"all")>
		<cfif arraylen(node)>
			<cfloop index="i" from="1" to="#arraylen(node)#">
				<cfif node[i].owner.href eq arguments.target>
					<cfset result = {"id"=node[i].owner.key,"parent"=node[i].owner.parent,"target"=node[i].owner.href,"title"=node[i].owner.title,"parenttarget"=node[i].owner.parenttarget}>
				</cfif>
				<cfbreak>
			</cfloop>
			<cfreturn result>
		</cfif>
	</cffunction>
	
	<cffunction name="getNavContext" access="remote" returntype="any">
		<cfargument name="identifier" required="true" type="string">
		<cfargument name="target" required="true" type="string">
		<cfset var apage = getpageid(argumentcollection=arguments)>
		<cfif !isdefined("arguments.family") or arraylen(arguments.family) eq 0>
			<cfset family = arraynew(1)>
		</cfif>
		<cfset arrayappend(family,apage)>
		<cfif apage.parent neq "root">
			<cfreturn getNavContext(identifier=apage.parent,target=apage.parenttarget,family=family)>
		<cfelse>
			<cfset family = arguments.family>
			<cfreturn family>
		</cfif>
	</cffunction>
	
	
	<cffunction name="nodeIsTerminal" access="public" returntype="boolean">
		<cfargument name="root" required="yes" type="string">
		<cfset children = structfindvalue(application.toc.getTOC(),arguments.root,"all")>
		<cfreturn arraylen(children) gt 1 ? false : true>
	</cffunction>
	
	<cffunction name="parseTOC" access="private" returntype="struct">
		<cfargument name="path" required="yes" type="string">
		<cfhttp url="http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/toc.js" result="docs">
		<cfset toc = rematch('(var dataObjWS.*?\);)',docs.tostring())>
		<cfset links = structnew()>
		<cfloop from="1" to="#arraylen(toc)#" index="i">
			<cfset key = replace(rematch('var WS.*?html',toc[i])[1],"var ","","all")>
			<cfset href = ''>
			<cfset titlematch 	= '(?:label: ")(.*?)(?=")'>
			<cfset hrefmatch 	= '(?:href:")(.*?)(?=")'>
			<cfset pathmatch	= '(?:html, )(.*?)(?=, false)'>
		
			<cfset links[key] = key>
			<cfset parent	= replace(rematch(pathmatch,toc[i])[1],'html, ','','all')>
			<cfset title	= replace(rematch(titlematch,toc[i])[1],'label: "','','all')>
			<cfset href		= "http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/"&replace(rematch(hrefmatch,toc[i])[1],'href:"','','all')>
			<cfset links[key] = {"title"=trim(title),"href"=trim(href),"parent"=trim(parent),"key"=trim(key)}> 
		</cfloop>
		<cfreturn links>
	</cffunction>
	
	<cffunction name="getPage" access="remote" returntype="any">
		<cfargument name="target" required="yes" type="string">
		<cfargument name="title" required="yes" type="string" default="">
		<cfset redirect = "">
		<!---check to make sure target is in the authoritative navigation; if it isn't, it's going to be an obsolete page and will break stuff--->
		<cfset matchedhref = structfindvalue(application.toc.getTOC(),arguments.title,"all")>
		<cfif not arraylen(matchedhref)>
			<cfset end = len(arguments.target)-5>
			<cfset trimmed = mid(arguments.target,findnocase('WS',arguments.target),end)>
			<cfset redirect = replace(trimmed,'.html','','all')>
			<cfif arguments.title contains ' functions'>
				<cfset arguments.target = 'WSc3ff6d0ea77859461172e0811cbec1a60c-7ffc.html##'&redirect>
			<cfelseif arguments.title contains ' tags'>
				<cfset arguments.target = 'WSc3ff6d0ea77859461172e0811cbec17576-7ffc.html##'&redirect>
			<cfelseif arguments.title contains '::'>
				<cfset arguments.target = 'WSc3ff6d0ea77859461172e0811cbec22c24-5eac.html##'&redirect>
			</cfif>
		</cfif>
		<cfhttp url="http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/#arguments.target#" result="result" resolveurl="yes" redirect="yes" />
		<!---check to make sure a faux-redirect page hasn't been returned--->
		<cfset match = rematch('<meta http-equiv="refresh" content="0;url=([0-9a-zA-Z-.##]*)" />',result.filecontent)>
		<!---if there's a match, we need to strip out the redirect link and re-run the http call--->
		<cfif arraylen(match)>
			<cfset newurl = rereplacenocase(match[1],'<meta http-equiv="refresh" content="0;url=([0-9a-zA-Z-.##]*)" />','\1','all')>
			<cfset newurl = "http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/"&newurl>
			<cfhttp url="#newurl#" result="result" resolveurl="yes" redirect="yes" />
		</cfif>
		<cfscript>		
			content = trim(result.filecontent);
			// remove adobe top bar
			content = rereplacenocase(content,'(<div id="mnemonic">(.*?)</div>)','',"all");
			// remove adobe search bar
			content = rereplacenocase(content,'(<div id="searchbar">(.*?)</div>)','',"all");
			// remove the dump "navigation" buttons
			content = rereplacenocase(content,'<ul class="navigation">.*?</ul>','','all');
			// remove adobe logo
			content = rereplacenocase(content,'(<img src="http://help.adobe(.com|.com:80)/en_US/ColdFusion/9.0/CFMLRef/images/adobe-lq.png" />)','','all');
			// remove stupid and worthless 'home' link
			content = rereplacenocase(content,'<a href="http://help.adobe(.com|.com:80)/en_US/ColdFusion/9.0/CFMLRef/WSf01dbd23413dda0e50e0885e12057559231-8000.html"><b>Home</b></a> / ','',"all");
			// remove stupid and worthless 'reference' link
			content = rereplacenocase(content,'<a href="http://help.adobe(.com|.com:80)/en_US/ColdFusion/9.0/CFMLRef/WSf01dbd23413dda0e50e0885e12057559231-8000.html"><b>ColdFusion.*?Reference</b></a> / ','','all');
			// remove other version of refrence link
			content = rereplacenocase(content,'<a href="http://help.adobe(.com|.com:80)/en_US/ColdFusion/9.0/CFMLRef/WSf01dbd23413dda0e50e0885e12057559231-8000.html"><b>ColdFusion.*?Reference</b></a>','','all');			
			// match on regular documentation links; replace href with onlick event so we can intercept page navigation
			content = rereplacenocase(content,'<a href="(http://help.adobe(.com|.com:80)/en_US/ColdFusion/9.0/CFMLRef/)([0-9a-zA-Z-]*\.html)">([0-9a-zA-Z,\-+: \n\r\.]*)</a>','<a href="javascript:void(0);" onclick="loadURL(''\3'',''\4'');">\4</a>','all');
			// match on breadcrumb navigation links; replace href with onclick event so we can intercept page navigation
			content = rereplacenocase(content,'<a href="(http://help.adobe(.com|.com:80)/en_US/ColdFusion/9.0/CFMLRef/)([0-9a-zA-Z-]*\.html)">(<b>)([a-zA-Z0-9,\-+: \n\r\.]*)(</b>)</a>','<a href="javascript:void(0);" onclick="loadURL(''\3'',''\5'');">\4\5\6</a>','all');
			
			// get rid of unneeded script tags
			content = rereplacenocase(content,'<\s*script.*?>(.*?)<\/\s*?script[^>\w]*?>','','all');
			// get rid of html comments
			content = rereplacenocase(content,'<!(--.*?--)?>|<!(--.*?--)>','','all');
			// remove unnecessary whitespace
			content = htmlremovewhitespace(input=content);
			// strip internal page links of the protocol and target, and just leave the # and link
			content = rereplacenocase(content,'(href=")(http://help.adobe(.com|.com:80)/en_US/ColdFusion/9.0/CFMLRef/)(.*?)(")','href="\4"',"all");
			// for external links, push targer to _blank so the current app isn't redirected
			content = rereplacenocase(content,'target="_self"','target="_blank"','all');
			// swap out any port 80 urls with the real mccoy
			content = rereplacenocase(content,':80','','all');
			// strip css files
			content = rereplacenocase(content,'<link rel="stylesheet" type="text/css" href=".*\.css" />','','all');
			// add bookmark icon to content
			content = rereplacenocase(content,'(<h1>)(.*)(</h1>)','\1\2<a href="javascript:void(0)" onclick="bookmark()" class="bookmark" title="Bookmark this page!"></a><a href="javascript:void(0)" onclick="getNote()" class="note-icon" title="Leave a note for this page"></a>\3','all');
			// return our cleaned up and re-appropriated content :)
			return {"content"=content,"title"=arguments.title,"target"=arguments.target,"redirect"=redirect};
		</cfscript>
	</cffunction>
	
	<cffunction name="loadPage" access="remote" returntype="any">
		<cfargument name="target" required="yes" type="string">
		<cfargument name="title" required="yes" type="string" default="">
		<cfset redirect = "">
		<cfset lastresort = false>
		<!---if we have a hash tag in the target, we know it's coming from our app...so we can trust that link exists and just parse it out--->
		<cfif arguments.target contains "##">
			<cfset redirect = rereplacenocase(arguments.target,'(.*.html)(##.*)','\2','all')>
			<cfset arguments.target = rereplacenocase(arguments.target,'(.*.html)(##.*)','\1','all')>
		<cfelse>
			<!---check to make sure target is in the authoritative navigation; if it isn't, it's going to be an obsolete page and will break stuff--->
			<cfset matchedhref = structfindvalue(application.toc.getTOC(),arguments.target,"all")>
			<cfif not arraylen(matchedhref)>
				<cfset end = len(arguments.target)-5>
				<cfset trimmed = mid(arguments.target,findnocase('WS',arguments.target),end)>
				<cfset redirect = replace(trimmed,'.html','','all')>
				<cfif arguments.title contains ' functions'>
					<cfset arguments.target = 'WSc3ff6d0ea77859461172e0811cbec1a60c-7ffc.html##'&redirect>
				<cfelseif arguments.title contains ' tags'>
					<cfset arguments.target = 'WSc3ff6d0ea77859461172e0811cbec17576-7ffc.html##'&redirect>
				<cfelseif arguments.title contains '::'>
					<cfset arguments.target = 'WSc3ff6d0ea77859461172e0811cbec22c24-5eac.html##'&redirect>
				<cfelse>
					<!---if we can't find the url, hit up remote server--->
					<cfhttp url="http://help.adobe.com/en_US/ColdFusion/9.0/CFMLRef/#arguments.target#" result="result" resolveurl="yes" redirect="yes" />
					<!---check to make sure a faux-redirect page hasn't been returned--->
					<cfset match = rematch('<meta http-equiv="refresh" content="0;url=([0-9a-zA-Z-.##]*)" />',result.filecontent)>
					<!---if there's a match, we need to strip out the redirect link and re-run the http call--->
					<cfif arraylen(match)>
						<!---this will get the reference to the parent--->
						<cfset arguments.target = rereplacenocase(match[1],'<meta http-equiv="refresh" content="0;url=([0-9a-zA-Z-.##]*)" />','\1','all')>
					</cfif>
				</cfif>
			</cfif>
		</cfif>
		<cfhttp url="#application.urlpath##arguments.target#" result="result" resolveurl="no" redirect="yes" />
		<cfscript>		
			content = trim(result.filecontent);
			return {"content"=content,"title"=arguments.title,"target"=arguments.target,"redirect"=redirect};
		</cfscript>
	</cffunction>
	
	<cffunction name="htmlRemoveWhiteSpace" returntype="string" output="no" hint="A simple function to remove white space from HTML (Except for <pre> tags)">
		<cfargument name="input" type="string" required="yes" />
		<cfargument name="remcoms" type="boolean" required="no" default="false" />
		<cfset var locvar = StructNew() />
		<cfset locvar.str = arguments.input />
		<cfif Len(locvar.str) gt 0>
		  <cftry>
			 <cfif FindNoCase("<pre>", locvar.str) gt 0>
				<cfset locvar.newstr = "" />
				<cfset locvar.pos = 1 />
				<cfset locvar.is_done = false />
				<cfloop condition="NOT locvar.is_done">
				   <cfset subex = REFind('(?i)<pre[^>]*>(.+?)</pre>', locvar.str, locvar.pos, true)>
				   <cfif subex.len[1] eq 0>
					  <cfset locvar.is_done = true />
				   <cfelse>
					  <cfset locvar.html_str = ReReplace(Mid(locvar.str, locvar.pos, subex.pos[1] - locvar.pos), '[\r\n\t]+', ' ', 'ALL') />
					  <cfif arguments.remcoms>
						 <!--- replace all the comments --->
						 <cfset locvar.html_str = ReReplace(locvar.html_str, '<!--.*?-->', '', 'ALL') />
						 <cfset locvar.html_str = ReReplace(locvar.html_str, '/\*.*?\*/', '', 'ALL') />
					  </cfif>
					  <cfset locvar.pre = Mid(locvar.str, subex.pos[1], subex.len[1]) />
					  <cfset locvar.newstr = locvar.newstr & locvar.html_str & locvar.pre />
					  <cfset locvar.pos = subex.pos[1] + subex.len[1] />
				   </cfif>
				</cfloop>
				<cfset locvar.newstr = locvar.newstr & ReReplace(Right(locvar.str, Len(locvar.str) - locvar.pos + 1),"[\r\n\t]+"," ","ALL") />
				<cfset locvar.str = locvar.newstr />
			 <cfelse>
				<cfset locvar.str = ReReplace(locvar.str,"[\r\n\t]+"," ","ALL") />
				<cfif arguments.remcoms>
				   <!--- replace all the comments --->
				   <cfset locvar.str = ReReplace(locvar.str, '<!--.*?-->', '', 'ALL') />
				   <cfset locvar.str = ReReplace(locvar.str, '/\*.*?\*/', '', 'ALL') />
				</cfif>
			 </cfif>
			 <cfcatch type="any">
				<cfset locvar.str = cfcatch.message />
			 </cfcatch>
		  </cftry>
		</cfif>
		<cfreturn locvar.str />
	</cffunction>
</cfcomponent>