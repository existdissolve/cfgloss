<cfcomponent>
	<cffunction name="sendEmail" access="remote" returntype="void">
		<cfargument name="name" type="string" required="yes">
		<cfargument name="email" type="string" required="yes">
		<cfargument name="comment" type="string" required="yes">
		<cfmail to="yourname@gmail.com" subject="Feedback for Gloss" from="#arguments.email#" type="html" server="localhost" 
				username="yourname@gmail.com" password="dapassword">
			<cfoutput>
				From #arguments.name#: <br /><br />
				#comment#
			</cfoutput>
		</cfmail>
	</cffunction>
</cfcomponent>