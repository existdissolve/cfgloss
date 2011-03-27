<cfcomponent>
	<cffunction name="createcollection" access="public" returntype="void">
		<cfcollection action="create" collection="search_results" path="#expandpath("content/")#">
		<cfindex collection="search_results" action="update" extensions=".html" key="#expandpath("content/")#" type="path">
	</cffunction>
	
	<cffunction name="getcollection" access="public" returntype="any">
		<cfcollection action="list" name="results">
		<cfreturn results>
	</cffunction>
	
	<cffunction name="createindex" access="public" returntype="void">
		<cfindex collection="search_results" action="refresh" extensions=".html" key="#expandpath("content/")#" type="path">
	</cffunction>
	
	<cffunction name="deletecollection" access="public" returntype="void">
		<cfargument name="collection">
		<cfcollection action="delete" collection="#arguments.collection#">
	</cffunction>
	
	<cffunction name="searchcontent" access="remote" returntype="any">
		<cfargument name="query" type="string" required="yes">
		<cfif collectionexists("search_results")>
			<cfsearch name="results" collection="search_results" criteria="#lcase(arguments.query)#*" maxrows="970">			
			<cfloop query="results">
				<cfset results["Title"][results.currentrow] = rereplacenocase(trim(results.title[results.currentrow]),'.*\* ?','','all')>
			</cfloop>
			<cfquery name="results" dbtype="query">
				select 	*, 0 as relevance
				from	results
				where 	lower(title) = '#lcase(arguments.query)#'
				
				union
				
				select 	*, 1 as relevance
				from	results
				where 	lower(title) like '%#lcase(arguments.query)#'
				
				union
				
				select	*, 2 as relevance
				from	results
				where 	lower(title) like '%#lcase(arguments.query)#%'
				
				union
				
				select	*, 3 as relevance
				from	results
				where	lower(summary) like '%#lcase(arguments.query)#%'
				order by relevance
			</cfquery>
		<cfelse>
			<cfset createcollection()>
			<cfset searchcontent(query=arguments.query)>
			<cfabort>
		</cfif>
		<cfscript>
			sresults = arraynew(1);
			sdupes = arraynew(1);
			maxct = results.recordcount > 15 ? 15 : results.recordcount;
			for(i=1;i<=maxct;i++) {
				item = {};
				title = rereplacenocase(trim(results.title[i]),'.*\* ?','','all');
				item["val"] = results.relevance[i];
				item["title"] 	= title;
				item["url"]		= replacenocase(results.url[i],'file/','','all');
				item["url"]		= replacenocase(item["url"],"/","","all");
				if(!arrayfind(sdupes,item.url)) {
					arrayappend(sdupes,item.url);
					isdupe = false;
				}
				else {
					isdupe = true;
				}
				item["summary"] = xmlformat(htmleditformat(rereplacenocase(results.summary[i],'.*Description','','all')));
				item["summary"] = replace(item["summary"],"Adobe&##xa0;ColdFusion&##xa0;9 * ","","all");
				item["row"] 	= i;
				if(!isdupe) {
					arrayappend(sresults,item);
				}
			}
			return {"search"=sresults};
		</cfscript>
	</cffunction>
	
	<!---
	This returns a yes/no value that checks for the existence of a named Verity collection.
	Version 3 by Dan G. Switzer, II
	
	@param collection      Collection name to check for. (Required)
	@return Returns a boolean.
	@author Dan G. Switzer, II (dswitzer@pengoworks.com)
	@version 3, Januaray 12, 2006
	--->
	<cffunction name="collectionExists" returnType="boolean" output="false" hint="This returns a yes/no value that checks for the existence of a named collection.">
		<cfargument name="collection" type="string" required="yes">
	
		<!---// by default return true //--->
		<cfset var bExists = true />
	
		<!---// if you can't search the collection, then assume it doesn't exist //--->
		<cftry>
			<cfsearch name="SearchItems" collection="#arguments.collection#" type="explicit" criteria="*" maxrows="1" />
			<cfcatch type="any">
				<!---// if the message contains the string "does not exist", then the collection can't be found //--->
				<cfif cfcatch.message contains "does not exist">
					<cfset bExists = false />
				</cfif>
			</cfcatch>
		</cftry>
	
		<!---// returns true if search was successful and false if an error occurred //--->
		<cfreturn bExists />
	</cffunction>
</cfcomponent>