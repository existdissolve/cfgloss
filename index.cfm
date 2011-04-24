<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
		<title>gloss :: A ColdFusion 9 Reference</title>
		<meta name="description" content="Gloss is a better way to browse the ColdFusion 9 reference.  You get the same great content, but can customize your experience with page bookmarking, in-line comments, and personal notes. Plus, you can use the search feature to find what you're looking for quickly...without wading through Adobe's entire knowledge-base.">
		<script type="text/javascript" src="http://extjs.cachefly.net/ext-3.3.1/adapter/ext/ext-base.js"></script> 
                <script type='text/javascript'>
			// hack hack hackity hack
			if (Ext.isIE6 && /msie 9/.test(navigator.userAgent.toLowerCase())) {
				Ext.isIE6 = Ext.isIE = false;
				Ext.isChrome = Ext.isIE9 = true;
			}
		</script>
		<script type="text/javascript" src="http://extjs.cachefly.net/ext-3.3.1/ext-all.js"></script> 
		<link href="http://extjs.cachefly.net/ext-3.3.1/resources/css/ext-all.css" type="text/css" rel="stylesheet" />
		<link href="http://extjs.cachefly.net/ext-3.3.1/resources/css/xtheme-gray.css" type="text/css" rel="stylesheet" />
		<script type="text/javascript" src="js/news.js"></script>
		<cfif islocalhost(cgi.REMOTE_ADDR)>
			<script type="text/javascript" src="js/gloss.js"></script> 
			<link href="css/style.css" type="text/css" rel="stylesheet" />
		<cfelse>
			<script type="text/javascript" src="js/gloss_min.js"></script> 
			<link href="css/style_min.css" type="text/css" rel="stylesheet" />
		</cfif>
	</head>
	<body id="page">
		<div class="wrapper" id="wrapper">
			<div class="toolbar" id="toolbar">
				<img src="images/gloss.png" class="icon" />
				<span class="apptitle">...a ColdFusion 9 Reference</span>
				<span id="message"></span>			
			</div>
			<div id="left" style="width:300px;float:left;"></div>
			<div id="body"></div>
		</div>
		<div id="iemessage">
			<h1>Uh-ohs on Gloss!</h1>
			<p>Yeah, it looks like you're using Internet Explorer (sorry for whatever circumstances are forcing you into that...!) or some other browser that's not quite up to snuff. This site requires a cutting-edge browser like Chrome, Firefox or Safari that can leverage some of the goodness of HTML5 to make functionality better...which also makes <strong>your</strong> experience better.
			 </p>
			 <p>So why not <a href="http://www.google.com/chrome/" target="_blank">get Chrome</a>, and then you can add Gloss to your Chrome Web Store apps. That way, you'll have one-click access to the goodness of Gloss without having to hunt through bookmarks. Plus, Chrome is just awesome, so why deprive yourself any longer?</p>
		</div>
	</body>
</html>