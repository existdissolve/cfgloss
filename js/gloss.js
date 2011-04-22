/***********************************************************************************
	BEGIN: Ext.onReady()
***********************************************************************************/
Ext.onReady(function(){
	var thewrapper = Ext.get("wrapper");
	if(Ext.isIE==true || !storage) {
		Ext.getBody().mask('',"maskmsg");
		Ext.get("iemessage").fadeIn({endOpacity:1,easing:'easeOut',duration:.5});
		return false;
	}
	else {
		Ext.getBody().mask("<img src='images/loader7.gif' align='absmiddle' style='margin-right:5px;' />  Gloss...a ColdFusion 9 Reference","maskmsg");
		setTimeout("Ext.getBody().unmask()",1500);
	}
	
	/***********************************************************************************
		BEGIN: Tree Panel 
	***********************************************************************************/
	Ext.QuickTips.init();
	// shorthand for Ext.tree
	var Tree = Ext.tree;
	// create TreeLoader with URL and baseParams
	var loader = new Tree.TreeLoader({
		url: 'com/parser.cfc',
		baseParams: {
			method:"getNavigationSectionAJAX",
			returnformat:"json"
		},	
	});
	// create TreePanel to hold our tree data
	var tree = new Tree.TreePanel({
		useArrows: true,
		id: "doctree",
		autoScroll: true,
		animate: true,
		enableDD: false,
		containerScroll: true,
		rootVisible:false,
		border: false,
		baseCls:'x-plain',
		cls:"doctree",
		// auto create TreeLoader
		loader: loader,
		root: {
			nodeType: 'async',
			text: 'ColdFusion 9 Reference',
			draggable: false,
			id: 'root'
		},
		listeners: {
			click: handleClick
		}
	});

	// render the tree to the "left" element, and expand the root node
	tree.render("left");
	tree.getRootNode().expand();
	/***********************************************************************************
		END: Tree Panel 
	***********************************************************************************/
	
	/***********************************************************************************
		BEGIN: Views and Stores 
	***********************************************************************************/
	// create new ListView for displaying comments
	var commentsview = new Ext.list.ListView({
		id: "commentslist",
		store: {},
		hideHeaders: true,
		emptyText: "<span class='empty'>No comments!</span>",
		reserveScrollOffset: true,
		columns: [
			{
				dataIndex: 'description',
				width:300,
				tpl: "<tpl for='.'><div class='comments'><div class='comment-header'><span class='comment-author'>{author}</span><span class='comment-date'>{pubdate}</span></div><div class='comment-content'>{description}</div></div></tpl>"
			},
		]
	});

	// if browser has db, set temp empty string for data; otherwise, read in localstorage records
	var notesdata = haswebsql ? '' : Ext.decode(localStorage.notes);
	// set up new store for notes
	var notesstore = new Ext.data.JsonStore({
		data: notesdata,
		root: 'notes',
		fields: ['notes','target','title']
	});
	// set total; for sql, will be temp of 0; for localstorage, length of serialized values
	var notestotal = haswebsql ? 0 : localStorage.notes!="" ? notesstore.getTotalCount() : 0;
	// create new ListView for displaying notes
	var notesview = new Ext.list.ListView({
		id: "noteslist",
		store: notesstore.getTotalCount() ? notesstore : {},
		hideHeaders: true,
		emptyText: "<span class='empty'>No notes!</span>",
		reserveScrollOffset: true,
		columns: [
			{
				dataIndex: 'notes',
				//width:'270px',
				tpl: "<tpl for='.'><div onclick='delegate_note(\"get\",{title:\"{title}\",target:\"{target}\"})' ext:qtip='{notes}'>{title}</div></tpl>"
			},
			{
				tpl: "<tpl for='.'><img src='images/link_go.png' title='Open Docs Entry' onclick='loadURL(\"{target}\",\"{title}\")' /></tpl>",
				width: .08
			},
			{
				tpl: "<tpl for='.'><img src='images/delete.png' title='Delete Note' onclick='delegate_note(\"delete\",{title:\"{title}\",target:\"{target}\"})' /></tpl>",
				width: .08
			}
		]
	});
	// if browser has db, set temp empty string for data; otherwise, read in localstorage records
	var bookmarksdata = haswebsql ? '' : Ext.decode(localStorage.bookmarks);
	// set up new store for bookmarks
	var bookmarksstore = new Ext.data.JsonStore({
		data: bookmarksdata,
		root: 'bookmarks',
		fields: ['target','title']
	});
	// set total; for sql, will be temp of 0; for localstorage, length of serialized values
	var bookmarkstotal = haswebsql ? 0 : localStorage.bookmarks!="" ? bookmarksstore.getTotalCount() : 0;
	// create new ListView object to display bookmarks
	var bookmarksview = new Ext.list.ListView({
		id:"bookmarklist",
		store: bookmarksstore.getTotalCount() ? bookmarksstore : {},
		hideHeaders: true,

		emptyText: "<span class='empty'>No bookmarks!</span>",
		reserveScrollOffset: true,
		columns: [
			{
				header: 'Bookmark',
				dataIndex: 'title',
				tpl: "<tpl for='.'><div onclick='loadURL(\"{target}\",\"{title}\")'>{title}</div></tpl>"
			},
			{
				header: "Delete",
				tpl: "<tpl for='.'><img src='images/delete.png' onclick='delegate_bookmark(\"delete\",{title:\"{title}\"})' /></tpl>",
				width: .08
			}
		]
	});
	
	var notificationdata = "";
	var notificationstore = new Ext.data.JsonStore({
		data: notificationdata,
		root: "notifications",
		fields: ['notificationid','title','content','datereleased','hasseen']
	});
	var notificationtotal = 0;
	
	if(haswebsql) {
		var ntpl = 	"<tpl for='.'><div onclick='glossdb.data.getnotification({notificationid})' ext:qtip='{content}'>{title}</div></tpl>"
	}
	else {
		var ntpl = "<tpl for='.'><div onclick='glossdb.getnotification(\"{title}\")' ext:qtip='{content}'>{title}</div></tpl>"
	}
	var notificationview = new Ext.list.ListView({
		id: "notificationlist",
		store: notificationstore.getTotalCount() ? notificationstore : {},
		hideHeaders: true,
		emptyText: "<span class='empty'><a href='javascript:void(0)' onclick='glossdb.alerts.authorize()'>Authorize Gloss</a> to notify you of new features</span>",
		reserveScrollOffset: true,
		columns: [
			{
				header: 'News',
				dataIndex: 'title',
				tpl: ntpl
			}  
		]										 
	});
	
	// if browser has web sql, allow history
	if(haswebsql) {
		var historydata = '';
		var historystore = new Ext.data.JsonStore({
			data: historydata,
			root: 'history',
			fields: ['target','title','id','dateaccessed']
		});
		var historytotal = 0;
		var historyview = new Ext.list.ListView({
			id: "historylist",
			store: historystore.getTotalCount() ? historystore : {},
			hideHeaders: true,
			emptyText: "<span class='empty'>No history to speak of!</span>",
			reserveScrollOffset: true,
			columns: [
				{
					header: 'History',
					dataIndex: 'title',
					tpl: "<tpl for='.'><div onclick='loadURL(\"{target}\",\"{title}\")' ext:qtip='{dateaccessed}'>{title}</div></tpl>"
				},
				{
					header: "Delete",
					tpl: "<tpl for='.'><img src='images/delete.png' onclick='glossdb.data.deletehistory(\"{title}\",\"{target}\",{id})' /></tpl>",
					width: .08
				}	  
			]
		});
	}
	
	var searchtpl = new Ext.XTemplate(
		"<tpl for='search'><div class='search-header' ext:qtip='{summary}' tabIndex='{row+1000}'><span class='comment-author'>{title}</span></div></tpl>"							  
	);
	var searchmodel = new Ext.grid.ColumnModel({
        defaults: {
            width: 120,
            sortable: false
        },
        columns: [{
			id: 'title', 
			width: 200, 
			sortable: false, 
			dataIndex: 'title',
			renderer: function(value, metaData, record, rowIndex, colIndex, store) {
				metaData.css = "search-header";
				return value;
   			}
		}]
	});
	var searchselmodel = new Ext.grid.RowSelectionModel({
		singleSelect:true
	});
	var searchview = new Ext.grid.GridPanel({
		id:"searchlist",
		store: {},
		hideHeaders: true,
		border:false,
		padding:"5px 3px 5px",
		emptyText: "<span class='empty'>Search for something!</span>",
		reserveScrollOffset: true,
		colModel: searchmodel,
		autoHeight: true,
		listeners: {rowclick:handleSearch,keypress:handleSearchKey},
		sm: searchselmodel
	});
	/***********************************************************************************
		END: Views and Stores 
	***********************************************************************************/
	
	/***********************************************************************************
		BEGIN: Settings Form
	***********************************************************************************/
	// "yes" radio button for auto-collapsing inactive panels
	var radioAutoCollapseYes = new Ext.form.Radio({
		id: "radioAutoCollapseYes",
		name: "autoCollapse",
		hideLabel: true,
		boxLabel: "Yes",
		checked: haswebsql ? false : storage.singleexpand=='true' ? true : false,
		listeners: {
			"check": function() {
				if(this.checked) {
					// show settings message
					showMessage("setting");
					if(haswebsql) {
						glossdb.data.updatesetting("acy");
					}
					else {
						storage.singleexpand = true;
					}
					updateSettings("singleexpand",true);
				}
			}
		}
	});
	// "no" radio button for auto-collapsing inactive panels
	var radioAutoCollapseNo = new Ext.form.Radio({
		id: "radioAutoCollapseNo",
		name: "autoCollapse",
		hideLabel: true,
		boxLabel: "No",
		checked: haswebsql ? false : storage.singleexpand=='false' ? true : false,
		listeners: {
			"check": function() {
				if(this.checked) {
					// show settings message
					showMessage("setting");
					if(haswebsql) {
						glossdb.data.updatesetting("acn");
					}
					else {
						storage.singleexpand = false;
					}
					updateSettings("singleexpand",false);
				}
			}
		}
		
	});
	// radio group for radio buttons
	var radioAutoCollapse = new Ext.form.FieldSet({
		id:"radioAutoCollapse",
		title: "Collapse inactive navigation?",
		items: [radioAutoCollapseYes,radioAutoCollapseNo]
	});
	
	// "yes" radio button for auto-collapsing inactive panels
	var radioAutoLoadYes = new Ext.form.Radio({
		id: "radioAutoLoadYes",
		name: "autoLoad",
		hideLabel: true,
		boxLabel: "Yes",
		checked: haswebsql ? false : storage.autoload=='true' ? true : false,
		listeners: {
			"check": function() {
				if(this.checked) {
					// show settings message
					showMessage("setting");
					if(haswebsql) {
						glossdb.data.updatesetting("aly");
					}
					else {
						storage.autoload = true;
					}
					updateSettings("autoload",true);
				}
			}
		}
	});
	// "no" radio button for auto-collapsing inactive panels
	var radioAutoLoadNo = new Ext.form.Radio({
		id: "radioAutoLoadNo",
		name: "autoLoad",
		hideLabel: true,
		boxLabel: "No",
		checked: haswebsql ? false : storage.autoload=='false' ? true : false,
		listeners: {
			"check": function() {
				if(this.checked) {
					// show settings message
					showMessage("setting");
					if(haswebsql) {
						glossdb.data.updatesetting("aln");
					}
					else {
						storage.autoload = false;
					}
					updateSettings("autoload",false);
				}
			}
		}
		
	});
	// radio group for radio buttons
	var radioAutoLoad = new Ext.form.FieldSet({
		id:"radioAutoLoad",
		title: "Auto-load most recent on next visit?",
		items: [radioAutoLoadYes,radioAutoLoadNo]
	});
	
	// "yes" radio button for auto-searching
	var radioAutoSearchYes = new Ext.form.Radio({
		id: "radioAutoSearchYes",
		name: "autoSearch",
		hideLabel: true,
		boxLabel: "Yes",
		checked: haswebsql ? false : storage.autosearch=='true' ? true : false,
		listeners: {
			"check": function() {
				if(this.checked) {
					// show settings message
					showMessage("setting");
					if(haswebsql) {
						glossdb.data.updatesetting("asy");
					}
					else {
						storage.autosearch = true;
					}
					updateSettings("autosearch",true);
				}
			}
		}
	});
	// "no" radio button for auto-collapsing inactive panels
	var radioAutoSearchNo = new Ext.form.Radio({
		id: "radioAutoSearchNo",
		name: "autoSearch",
		hideLabel: true,
		boxLabel: "No",
		checked: haswebsql ? false : storage.autosearch=='false' ? true : false,
		listeners: {
			"check": function() {
				if(this.checked) {
					// show settings message
					showMessage("setting");
					if(haswebsql) {
						glossdb.data.updatesetting("asn");
					}
					else {
						storage.autosearch = false;
					}
					updateSettings("autosearch",false);
				}
			}
		}
		
	});
	// radio group for radio buttons
	var radioAutoSearch = new Ext.form.FieldSet({
		id:"radioAutoSearch",
		title: "Auto-search on each article load?",
		items: [radioAutoSearchYes,radioAutoSearchNo]
	});
	
	
	// form panel to hold config setting fields
	var settingsform = new Ext.form.FormPanel({
		id: "settings-form",
		autoWidth: true,
		autoHeight: true,
		items: [radioAutoCollapse,radioAutoLoad,radioAutoSearch],
		frame:true
	});
	/***********************************************************************************
		END: Settings Form
	***********************************************************************************/
	
	/***********************************************************************************
		BEGIN: Notes Form
	***********************************************************************************/
	// text area for entering note data
	var notetextarea = new Ext.form.TextArea({
		fieldLabel: "Notes",
		width: 200,
		id: "notetextarea",
		anchor: '100% 100%',
		x:0,
		y:30
	});
	// label to tell user which page the note is being created for
	var notelabel = new Ext.form.Label({
		id: "notelabel",
		cls: "label",
		x:0,
		y:0,
		anchor: '100%'
	});
	// title (hidden) for note
	var notetitle = new Ext.form.Hidden({
		id: "notetitle"
	});
	// target (hidden) for note
	var notetarget = new Ext.form.Hidden({
		id: "notetarget"
	});
	// form panel to hold NOTE form elements
	var noteform = new Ext.form.FormPanel({
		id: "noteform",
		layout:'absolute',
		items: [notelabel,notetextarea,notetitle,notetarget],
		frame: true
	});
	// window to hold form panel
	var notewindow = new Ext.Window({
		modal: true,
		resizable: true,
		draggable: true,
		layout:"fit",
		title: "Leave a Note",
		items: [noteform],
		width:350,
		padding:5,
		minHeight:300,
		height:300,
		closeAction: 'hide',
		id: "notewindow",
		fbar: [
			'->',
			{
				text: 'Save Note',
				handler:function(){delegate_note("save")}
			}
		]
	});
	/***********************************************************************************
		END: Notes Form
	***********************************************************************************/


	/***********************************************************************************
		BEGIN: Email Form
	***********************************************************************************/
	// text area for entering note data
	var emailcontent = new Ext.form.TextArea({
		fieldLabel: "Feedback",
		width: 300,
		height:150,
		id: "emailcontent",
		allowBlank: false
	});
	// title (hidden) for note
	var emailname = new Ext.form.TextField({
		id: "emailname",
		allowBlank: false,
		width: 300,
		fieldLabel: "Name"
	});
	// target (hidden) for note
	var emailaddress = new Ext.form.TextField({
		id: "emailaddress",
		allowBlank: false,
		width: 300,
		fieldLabel: "Email",
		vtype: "email"
	});
	// form panel to hold NOTE form elements
	var emailform = new Ext.form.FormPanel({
		id: "emailform",
		items: [emailname,emailaddress,emailcontent],
		frame: true,
		monitorValid:true,
		buttons: [
			{
				text: 'Send Email',
				handler:sendEmail,
				formBind: true
			}
		]
	});
	// window to hold form panel
	var emailwindow = new Ext.Window({
		modal: true,
		resizable: false,
		draggable: true,
		title: "Send Feedback",
		items: [emailform],
		width:450,
		padding:5,
		closeAction: 'hide',
		id: "emailwindow"
	});
	
	//search field
	var searchfield = new Ext.form.TextField({
		id: "searchfield",
		width: '100%',
		enableKeyEvents: true,
		listeners: {
			"keyup": getSearch
		},
		tabIndex:1000
	});
	// search panel
	var searchwrap = new Ext.Panel({
		cls: "searchwrap",
		baseCls: "x-plain",
		items: [searchfield]					
	});
	/***********************************************************************************
		END: Notes Form
	***********************************************************************************/


	/***********************************************************************************
		BEGIN: Viewport
	***********************************************************************************/
	if(haswebsql) {
		var historypanel = {
			xtype: "panel",
			title: "My History ("+historytotal+")" ,
			autoScroll: true,
			items: [historyview],
			iconCls: "history-icon",
			id: "historypanel",
			collapsed: true
		};
	}
	else {
		var historypanel = {hidden:true};
	}
	// create viewport to handle full-screen management of app
	new Ext.Viewport({
		layout: 'border',
		items: [
			// north panel -> branding and app title
			{
				region: 'north',
				contentEl: 'toolbar',
				height:27,
				border: false,
				margins: '0 0 5 0'
			}, 
			// west panel -> holds navigation tree
			{
				region: 'west',
				collapsible: false,
				width: 300,
				contentEl: "left"
			}, 
			// east panel -> holds tools, comments, etc.
			{
				region: 'east',
				collapsible: true,
				layout: "accordion",
				id: "userpanel",
				layoutConfig: {
					titleCollapse: true,
					animate: true
				},
				width: 300,
				items: [
					// panel for displaying bookmarks
					{
						xtype: "panel",
						title: 'Search' ,
						autoScroll: true,
						items: [searchwrap,searchview],
						iconCls: "search-icon",
						id: "searchpanel",
						collapsed: false,
						collapsible: false,
						listeners: {
							"expand": function() {
								Ext.getCmp("searchfield").focus(true);	
							}
						}
					},
					{
						xtype: "panel",
						title: "My Bookmarks ("+bookmarkstotal+")" ,
						autoScroll: true,
						items: [bookmarksview],
						iconCls: "bookmarks-icon",
						id: "bookmarkspanel",
						collapsed: true
					},
					// panel for displaying comments
					{
						xtype: "panel",
						title: "Comments",
						autoScroll: true,
						items: [commentsview],
						iconCls: "comments-icon",
						id: "commentspanel",
						collapsed: true
					},
					// panel for displaying notes
					{
						xtype: "panel",
						title: "My Notes ("+notestotal+")",
						autoScroll: true,
						items: [notesview],
						iconCls: "notes-icon",
						id: "notespanel",
						collapsed: true
					},
					historypanel,
					{
						xtype: "panel",
						title: "Gloss News ("+notificationtotal+")",
						autoScroll: true,
						items: [notificationview],
						iconCls: "notification-icon",
						id:	"notificationpanel",
						collapsed: true
					},
					// panel for displaying app settings
					{
						xtype: "panel",
						title: "Settings",
						autoScroll: true,
						items: [settingsform],
						iconCls: "settings-icon",
						id: "settingspanel",
						collapsed: true
					}
				]
			}, 
			// center panel -> where all the super fancy page content goes :)
			{
				region: 'center',
				xtype: 'panel',
				contentEl: "body",
				autoScroll: true,
				id: "bodypanel"
			}
		]
	});	
	new Ext.KeyMap(Ext.get(document), {
		key:	'S',
		ctrl:	true,
		handler:ShowSearch,
		stopEvent:true
	});
	
	function ShowSearch() {
		Ext.getCmp("searchpanel").expand();
		Ext.getCmp("searchfield").focus(true);
	}
	/***********************************************************************************
		END: Viewport
	***********************************************************************************/			
	
	/***********************************************************************************
		BEGIN: Startup Scripts to run after Ext elements have been created
	***********************************************************************************/
	if(haswebsql) {	
		glossdb = new DBMgr();
	}
	else {
		glossdb = new GlossStorage();	
	}
	var url = Ext.urlDecode(location.search.substring(1));
	// if there's a url param defined, try to get the page based on it
	if(url.p && url.p != "") {
		Ext.Ajax.request({
			url: "com/parser.cfc",
			params: {method:"getPageID",returnformat:"json",identifier:"",target:url.p+".html"},
			success: function(req) {
				var req = Ext.decode(req.responseText);
				if(req!="") {
					loadURL(req.target,req.title);
				}
				else {
					loadURL("index.html","About this App");	
				}
			},
			failure: function() {
				loadURL("index.html","About this App");
			}
		});	
	}
	else {
		delegate_startup();	
	}
});
/***********************************************************************************
	END: Ext.onReady()
***********************************************************************************/

/***********************************************************************************
	BEGIN: DBMgr
***********************************************************************************/
var DBMgr = function() {
	this.database   =   openDatabase('Gloss',"",'Gloss SQL Goodness',2000000);
	this.apphistory =   ['0.90','1.00'];
	this.appversion =   "1.00";
	this.data 		=	new GlossData(this);
	this.alerts		=	new GlossAlerts(this);
	this.init();
}
DBMgr.prototype = {
	/***************************************************************************************	
	setSchema(): master process for updating outdated/creating client schemas               
    Each case should be modified to get the schema to the next iteration.               
    Therefore, instead of trying to define a use case for getting every possible       
    case to the current version, we can only have to worry about getting to the next    
    evolution                                                                           
	***************************************************************************************/
    init:		function() {
		this.setSchema();	
	},
	setSchema:  function() {
		// set array for holding our sql statements; sql lite can only process one statement at a time
		var sql = new Array();
		// get history object
		var history = this.getHistory();
		// if client db version is not equal to current appversion, start iterative update
		var ver = history.iscurrent ? this.appversion : history.current;
		if(!history.iscurrent) {
			switch(ver) {
				case '0.90':    
					//sql[0]	= 	"create table bookmarks(target primary key,title);";
					//sql[1] 	= 	"create table notes(target primary key,title,notes);";
					//sql[2]	=	"create table history(id integer primary key autoincrement,target,title,dateaccessed);";
					//sql[3]	=	"create table settings(id primary key,singleexpand,autoload,autosearch);";
					//sql[4]	=	"create table notifications(notificationid,hasseen);";
					break;
				// default will be a snapshot of the current version of the schema; 
				default:
					sql[0]	= 	"create table bookmarks(target primary key,title);";
					sql[1] 	= 	"create table notes(target primary key,title,notes);";
					sql[2]	=	"create table history(id integer primary key autoincrement,target,title,dateaccessed);";
					sql[3]	=	"create table settings(id primary key,singleexpand,autoload,autosearch);";
					sql[4]	=	"create table notifications(notificationid integer primary key autoincrement,title,content,datereleased,hasseen);";
			}
			this.database.transaction(function (t) {
				for(var i=0;i<sql.length;i++) {
					t.executeSql(sql[i]);
				}
			});
			this.setVersion();
		}
	},  
	getHistory: function() {
		var history = new Object();
		history.iscurrent = this.database.version==this.appversion ? true : false;
		history.current = '';
		history.upgrade = '';
		if(!history.iscurrent) {
			for(var i=0;i<this.apphistory.length;i++) {
				if(this.apphistory[i]==this.database.version) {
					history.current = this.apphistory[i];
					history.curpos  = i;
					history.upgrade = this.apphistory[i+1];
					break;
				}
			}
			if(this.database.version=='') {
				history.current = '';
				history.curpos  = this.apphistory.length;
				history.upgrade = this.appversion;
			}
		}
		else {
			history.current = this.appversion;
			history.upgrade = this.appversion;
		}
		return history;
	},
	setVersion: function(ver) {
		var history = this.getHistory();
		var curv = history.current;
		var newv = ver>0 ? ver : history.upgrade;
		this.database.changeVersion(curv,newv,function(t){},this.errorResponse,this.successResponse);
	},
	executesync:function(sql,values) {
		return this.database.transaction(
			function(t) {
				t.executeSql(sql,values);	
			}
		);
	},
	execute:	function(sql,values,fn) {
		var gloss = this;
		var fn = typeof fn=="function" ? fn : function(){};
		this.database.transaction(
			function(t){
				t.executeSql(sql,values,fn);
			}
		);
	},
	sync:		function() {
		var db = this;
		hasbookmarks 	= typeof storage.bookmarks!="undefined" ? true : false;
		hasnotes	 	= typeof storage.notes!="undefined" ? true : false;
		hasautoload	 	= typeof storage.autoload!="undefined" ? true : false;
		hasautosearch	= typeof storage.autosearch!="undefined" ? true : false;
		hassingleexpand	= typeof storage.singleexpand !="undefined" ? true : false;
		if(hasbookmarks) {
			var b = Ext.decode(storage.bookmarks).bookmarks;
			for(var i=0;i<b.length;i++) {
				var sqlvals	=	new Array(b[i].target,b[i].title);
				var sql 	= 	"insert into bookmarks (target,title) values (?,?);";
				this.execute(sql,sqlvals,function(){db.data.getbookmarks()});
			}
		}
		if(hasnotes) {
			var n = Ext.decode(storage.notes).notes;
			for(var i=0;i<n.length;i++) {
				var sqlvals	=	new Array(n[i].target,n[i].title,n[i].notes);
				var sql 	= 	"insert into notes (target,title,notes) values (?,?,?);";
				this.execute(sql,sqlvals,function(){db.data.getnotes()});
			}	
		}
		var sqlvals = new Array(1,hassingleexpand,hasautoload,hasautosearch);
		var sql 	= "insert into settings (id,singleexpand,autoload,autosearch) values (?,?,?,?);";
		this.execute(sql,sqlvals,function(){db.data.getsettings()});
		// reinit alerts to get first-time alerts
		this.alerts.init();
	},
	errorResponse: function error(t,e) {
		Ext.Msg.alert('Alert',e.message);
	},
	successResponse: function(t) {
		if(!glossdb.getHistory().iscurrent) {
			glossdb.setSchema();
		}
		else {
			// if default case, sync localStorage to websql
			glossdb.sync();	
		}
	}
};
/***********************************************************************************
	END: DBMgr
***********************************************************************************/

/***********************************************************************************
	BEGIN: GlossData
***********************************************************************************/
var GlossData = function(obj) {
	this.datacollections   =  ["bookmarks","history","notes","settings","notifications"];
	this.glossdb = 	obj;
	this.storage = sstorage;
	this.init();
}
GlossData.prototype = {
    init:			function() {
		this.getbookmarks();
		this.gethistory();
		this.getnotes();
		this.getsettings();
		this.getnotifications();
	},
	getlastviewed: 	function() {
		return Ext.decode(this.storage.lastviewed);
	},
	getbookmarks: 	function() {
		this.glossdb.execute('select * from bookmarks',[],this.setbookmarks);
	},
	setbookmarks:	function(transaction,records) {
		var ba = [];
		for(i=0;i<records.rows.length;i++) {
			var data = records.rows.item(i);
			ba.push({title:data.title,target:data.target});	
		}
		var dataset = {bookmarks:ba};
		// create new JSON Data Store from newly modified bookmarks object on localStorage
		var newstore = new Ext.data.JsonStore({
			data: dataset,
			root: 'bookmarks',
			fields: ['target','title']
		});
		var total = newstore.getTotalCount();
		Ext.getCmp("bookmarkspanel").setTitle("My Bookmarks ("+total+")");
		// call bindStore on ListView to change target data store
		Ext.getCmp('bookmarklist').bindStore(newstore);
		if(total>=1) {
			Ext.getCmp("bookmarkspanel").expand();
		}
	},
	addbookmark:	function() {
		var db = this;
		var lv = this.getlastviewed();
		var sqlvals	=	new Array(lv.title,lv.target);
		var sql 	= 	"select * from bookmarks where title = ? and target = ?";
		this.glossdb.execute(sql,sqlvals,
			function(transaction,records) {
				if(!records.rows.length) {
					var ssqlvals = 	new Array(lv.title,lv.target);
					var ssql 	 = 	"insert into bookmarks (title,target) values (?,?);";
					showMessage("bookmarkadd");
					db.glossdb.execute(ssql,ssqlvals,function(){db.getbookmarks()});
				}
			}
		);
	},
	deletebookmark:	function(title) {
		var db = this;
		var sqlvals	=	new Array(title);
		var sql 	= 	"delete from bookmarks where title = ?;";
		this.glossdb.execute(sql,sqlvals,function(){db.getbookmarks()});	
	},
	getnote:		function(title,target) {
		if(typeof title != 'undefined' && typeof target != 'undefined') {
			var db = this;
			var sql = 'select * from notes where title = ? and target = ?';
			var params = [title,target];
			this.glossdb.execute(
				sql,
				params,
				function(t,records) {
					if(records.rows.length) {
						db.shownote(title,target,records.rows.item(0).notes);
					}
					else {	
						db.shownote(title,target,"");
					}
				}
			); 
		}
		else {
			var notes = Ext.decode(sstorage.lastviewed);
			var title = notes.title;
			var target= notes.target;
			this.shownote(title,target,"");
		}
	},
	shownote:		function(title,target,notes) {
		delegate_note("show",{title:title,target:target,notes:notes});
	},
	getnotes:		function() {
		var db = this;
		this.glossdb.execute('select * from notes',[],db.setnotes);
	},
	setnotes:		function(transaction,records) {
		var na = [];
		for(i=0;i<records.rows.length;i++) {
			var data = records.rows.item(i);
			na.push({title:data.title,target:data.target,notes:data.notes});	
		}
		var dataset = {notes:na};
		// create new JSON Data Store from newly modified bookmarks object on localStorage
		var newstore = new Ext.data.JsonStore({
			data: dataset,
			root: 'notes',
			fields: ['target','title','notes']
		});
		var total = newstore.getTotalCount();
		Ext.getCmp("notespanel").setTitle("My Notes ("+total+")");
		// call bindStore on ListView to change target data store
		Ext.getCmp('noteslist').bindStore(newstore);
	},
	savenote:		function(title,target,notes) {
		var db = this;
		this.glossdb.execute(
			'select * from notes where title = ? and target = ?',
			[title,target],
			function(t,records) {
				showMessage("noteadd");
				if(records.rows.length) {
					db.updatenote(title,target,notes);
				}
				else {
					db.addnote(title,target,notes);
				}
			}
		);
	},
	addnote:		function(title,target,notes) {
		var db = this;
		var sqlvals	=	new Array(title,target,notes);
		var sql 	= 	"insert into notes (title,target,notes) values (?,?,?);";
		this.glossdb.execute(sql,sqlvals,function(){db.getnotes()});
	},
	updatenote:		function(title,target,notes) {
		var db = this;
		var sqlvals	=	new Array(notes,title,target);
		var sql 	= 	"update notes set notes = ? where title = ? and target = ?";
		this.glossdb.execute(sql,sqlvals,function(){db.getnotes()});
	},
	deletenote:		function(title,target) {
		var db = this;
		this.glossdb.execute('delete from notes where title = ? and target = ?',[title,target],function(){db.getnotes()});
	},
	addsettings:	function() {
		var db = this;
		var sql = "insert into settings (singleexpand,autoload,autosearch) values('true','true','false')";
		this.glossdb.execute(sql,[],function(){db.getsettings();});
	},
	getsettings:	function() {
		var db = this;
		this.glossdb.execute('select * from settings',[],
			function(transaction,records) {
				if(records.rows.length) {
					db.setsettings(transaction,records);
					return;
				}
				else {
					db.addsettings();
				}
			}											   
		);
	},
	setsettings:	function(transaction,records) {
		if(records.rows.length) {
			var acy = Ext.getCmp('radioAutoCollapseYes');
			var acn = Ext.getCmp('radioAutoCollapseNo');
			var aly = Ext.getCmp('radioAutoLoadYes');
			var aln = Ext.getCmp('radioAutoLoadNo'); 
			var asy = Ext.getCmp('radioAutoSearchYes');
			var asn = Ext.getCmp('radioAutoSearchNo');
			var ac = records.rows.item(0).singleexpand;
			var al = records.rows.item(0).autoload;
			var as = records.rows.item(0).autosearch;
			
			if(ac=='true') {
				acy.setValue(true);	
			}
			else {
				acn.setValue(true);
			}
			if(al=='true') {
				aly.setValue(true);	
			}
			else {
				aln.setValue(true);	
			}
			if(as=='true') {
				asy.setValue(true);	
			}
			else {
				asn.setValue(true);	
			}
		}
	},
	updatesetting:	function(col) {
		var sql = '';
		switch(col) {
			case "acy":
			  	sql = "update settings set singleexpand = 'true'";
			  	break;
			case "acn":
			  	sql = "update settings set singleexpand = 'false'";
			  	break;
			case "aly":
				sql = "update settings set autoload = 'true'";
				break;
			case "aln":
				sql = "update settings set autoload = 'false'";
			  	break;
			case "asy":
				sql = "update settings set autosearch = 'true'";
				break;
			case "asn":
			  	sql = "update settings set autosearch = 'false'";
			  	break;
		}
		this.glossdb.execute(sql);
	},
	gethistory:		function() {
		this.glossdb.execute('select * from history order by dateaccessed desc limit 50',[],this.sethistory);
	},
	sethistory:		function(transaction,records) {
		var ha = [];
		for(i=0;i<records.rows.length;i++) {
			var data = records.rows.item(i);
			ha.push({title:data.title,target:data.target,id:data.id,dateaccessed:data.dateaccessed});	
		}
		var dataset = {history:ha};
		// create new JSON Data Store from newly modified bookmarks object on localStorage
		var newstore = new Ext.data.JsonStore({
			data: dataset,
			root: 'history',
			fields: ['target','title','id','dateaccessed']
		});
		var total = newstore.getTotalCount();
		Ext.getCmp("historypanel").setTitle("My History ("+total+")");
		// call bindStore on ListView to change target data store
		Ext.getCmp('historylist').bindStore(newstore);
	},
	addhistory:		function(title,target) {
		var db	= this;
		var d 		= new Date();
		var m		= d.getMonth()+1;
		var date	= d.getUTCFullYear()+'-'+m+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();
		var sql 	= "insert into history (title,target,dateaccessed) values (?,?,?)";
		var params 	= [title,target,date];
		this.glossdb.execute(sql,params,function(){db.gethistory();});
	},
	deletehistory:	function(title,target,id) {
		var db 	= this;
		var sqlvals	=	[id];
		var sql 	= 	"delete from history where id = ?";
		this.glossdb.execute(sql,sqlvals,function(){db.gethistory();});
	},
	getnotifications:function() {
		this.glossdb.execute('select * from notifications',[],this.setnotifications);
	},
	setnotifications:function(transaction,records) {
		var na = [];
		for(i=0;i<records.rows.length;i++) {
			var data = records.rows.item(i);
			na.push({title:data.title,content:data.content,notificationid:data.notificationid,datereleased:data.datereleased,hasseen:data.hasseen});	
		}
		var dataset = {notifications:na};
		// create new JSON Data Store from newly modified bookmarks object on localStorage
		var newstore = new Ext.data.JsonStore({
			data: dataset,
			root: 'notifications',
			fields: ['title','content','notificationid','datereleased','hasseen']
		});
		var total = newstore.getTotalCount();
		Ext.getCmp("notificationpanel").setTitle("Gloss News ("+total+")");
		// call bindStore on ListView to change target data store
		Ext.getCmp('notificationlist').bindStore(newstore);
		this.glossdb.alerts.pushnotify();
	},
	addnotifications: function() {
		for(var x=0;x<glossnews.length;x++) {
			var g = glossnews[x];
			this.checknotification(g.title,g.content,g.datereleased);
		}
		this.getnotifications();
	},
	checknotification: function(title,content,datereleased) {
		var db = this;
		var sqlvals	=	new Array(title,datereleased);
		var sql 	= 	"select * from notifications where title = ? and datereleased = ?";
		this.glossdb.execute(sql,sqlvals,
			function(transaction,records) {
				if(!records.rows.length) {
					db.createnotification(title,content,datereleased);
				}
			}
		);
	},
	createnotification: function(title,content,datereleased) {
		var db = this;
		var ssqlvals = new Array(title,content,datereleased,false);
		var ssql	 = "insert into notifications (title,content,datereleased,hasseen) values (?,?,?,?)";
		this.glossdb.execute(ssql,ssqlvals);	
	},
	getnotification: function(id) {
		var sqlvals = [id];
		var sql		= "select * from notifications where notificationid = ?";
		this.glossdb.execute(sql,sqlvals,
			function(transaction,records) {
				var r = records.rows.item(0);
				var title 	= r.title;
				var content	= r.content;
				var win = new Ext.Window({
					draggable: 	true,
					resizable: 	true,
					modal:		true, 
					layout:		"fit",
					title: 		title,
					items: 		[{html: content, padding:5}],
					width:		350,
					padding:	5,
					minHeight:	300,
					height:		300,
					frame:		true
				}).show();
			}
		);
	},
	markasread: function(id) {
		var db = this;
		var sql = "update notifications set hasseen = 'true' where notificationid = ?";
		this.glossdb.execute(sql,[id],function(){db.getnotifications();});
	},
	runstartup:	function() {
		var db = this;
		var sql = "select * from settings";
		this.glossdb.execute(sql,[],
			function(transaction,records) {
				// set flags for settings
				if(records.rows.length) {
					var r = records.rows.item(0);
					updateSettings("singleexpand",r.singleexpand);
					updateSettings("autoload",r.autoload);
					updateSettings("autosearch",r.autosearch);
				}
				else {
					updateSettings("singleexpand",true);
					updateSettings("autoload",true);
					updateSettings("autosearch",false);
				}
				// try to load last visited page, if setting allows
				if(records.rows.length && records.rows.item(0).autoload=="true") {
					var sql = "select * from history order by dateaccessed desc limit 1";
					db.glossdb.execute(sql,[],
						function(transaction,records) {
							if(records.rows.length) {
								var r = records.rows.item(0);
								db.storage.lastviewed = Ext.encode({title:r.title,target:r.target});
								loadURL(r.target,r.title);	
							}
							else {
								loadURL("index.html","About this App");
							}
						}
					);
				}
				// otherwise, just load main page
				else {
					loadURL("index.html","About this App");
				}
			}
		);
	}
};
/***********************************************************************************
	END: GlossData
***********************************************************************************/

/***********************************************************************************
	BEGIN: GlossAlerts
***********************************************************************************/
var GlossAlerts = function(obj) {
	this.glossdb = obj;
	this.notice  = window.webkitNotifications;
	this.init();
}
GlossAlerts.prototype = {
	init:	function() {
		if(this.check()==0) {
			this.glossdb.data.addnotifications();
		}
	},
	check:	function() {
		return this.notice.checkPermission();	
	},
	authorize: function() {
		var notice = this;
		this.notice.requestPermission(function(){notice.init()});
	},
	pushnotify:	function() {
		var n = this;
		var sql = "select * from notifications where hasseen = 'false' order by datereleased desc limit ?";
		this.glossdb.execute(sql,[4],
			function(transaction,records) {
				if(records.rows.length) {
					for(var i=0;i<records.rows.length;i++) {
						var r = records.rows.item(i);
						var notify = n.notice.createHTMLNotification("notification_helper.cfm?title="+r.title+"&notificationid="+r.notificationid+"&content="+r.content);
						//var notify = n.notice.createNotification("images/icon_128.png",r.title,r.content);
						notify.id = r.notificationid;
						notify.ondisplay = function() {
							n.glossdb.data.markasread(this.id);			   
						};
						notify.show();
						
					}
				}
			}
		);
	}
}
/***********************************************************************************
	END: GlossAlerts
***********************************************************************************/

/***********************************************************************************
	BEGIN: GlossStorage
***********************************************************************************/
var GlossStorage = function() {
	this.glossdb = localStorage;
	this.init();
}
GlossStorage.prototype = {
    init:			function() {
		this.setbookmarks();
		this.setnotes();
		this.setnotifications();
	},
	getlastviewed:	function() {
		return Ext.decode(this.glossdb.lastviewed);
	},
	setlastviewed:	function() {
		
	},
	setbookmarks:	function() {
		// create new JSON Data Store from newly modified bookmarks object on localStorage
		var newstore = new Ext.data.JsonStore({
			data: this.getbookmarks(),
			root: 'bookmarks',
			fields: ['target','title']
		});
		var total = newstore.getTotalCount();
		Ext.getCmp("bookmarkspanel").setTitle("My Bookmarks ("+total+")");
		// call bindStore on ListView to change target data store
		Ext.getCmp('bookmarklist').bindStore(newstore);
		if(total>=1) {
			Ext.getCmp("bookmarkspanel").expand();
		}
	},
	getbookmarks:	function() {
		if(typeof this.glossdb.bookmarks == "undefined") {
			var bm = new Array();
			var bookmarksobj = {bookmarks:bm};	
			this.glossdb.bookmarks = Ext.encode(bookmarksobj);
		}
		return Ext.decode(this.glossdb.bookmarks);
	},
	isdupebookmark:	function(title,target) {
		var bookmarks = this.getbookmarks().bookmarks;
		var isdupe = false;
		for(i=0;i<bookmarks.length;i++) {
			if(bookmarks[i].title==title && bookmarks[i].target==target) {
				isdupe = true;
			}	
		}
		return isdupe;
	},
	addbookmark:	function(title,target) {
		// decode lastviewed and boommarks from localStorage
		var lv = this.getlastviewed();
		var bm = this.getbookmarks();
		// get reference to bookmarks array; if extant, use it, otherwise, create new array
		var bookmarks = typeof bm=='object' ? bm.bookmarks : new Array();
		var target = lv.target;
		var title = lv.title;
		// create new stucture to hole bookmark
		var bookmark = new Object();
		bookmark.target = target;
		bookmark.title = title;
		
		// if bookmark is not a dupe, add it to array and push the whole bookmarks object back to localStorage
		if(!this.isdupebookmark(title,target)) {
			showMessage("bookmarkadd");
			bookmarks.push(bookmark);
			this.writebookmarks(bookmarks);		
		} 
	},
	deletebookmark:	function(title) {
		var bookmarks = this.getbookmarks();
		for(i=0;i<bookmarks.bookmarks.length;i++) {
			// loop over bookmarks; if title match is found, remove bookmark from array
			if(bookmarks.bookmarks[i].title==title) {
				// show delete message
				showMessage("bookmarkdelete");
				bookmarks.bookmarks.splice(i,1);
			}
		}
		// write full object back to storage
		this.writebookmarks(bookmarks.bookmarks);	
	},
	writebookmarks: function(obj) {
		var bookmarksobj = {bookmarks:obj};
		this.glossdb.bookmarks = Ext.encode(bookmarksobj);	
		this.setbookmarks();
	},
	getnotes:	function() {
		if(typeof this.glossdb.notes == "undefined") {
			var notes = new Array();
			var notesobj = {notes:notes};	
			this.glossdb.notes = Ext.encode(notesobj);
		}
		return Ext.decode(this.glossdb.notes);	
	},
	getnote:	function(title,target) {
		var nt = this.getnotes();
		// get localStorage lastviewed object
		var lv = this.getlastviewed();
		// if notes exist in localStorage, use them; otherwise, create empty array
		var notes = typeof nt=='object' && nt != null ? nt.notes : new Array();
		var ntitle = '';
		var ntarget = '';
		var nnotes = '';
		// if title and target are defined, use the passed arguments values
		if(typeof title!='undefined') {
			ntitle = title;
			ntarget = target;
		}
		// otherwise, get the values from the lastviewed page values
		else {
			ntitle = lv.title;
			ntarget = lv.target;
		}
		// loop over localStorages notes object
		for(i=0;i<notes.length;i++) {
			// if note exists, set "nnotes" var to the extant note's value
			if(notes[i].title==ntitle) {
				var nnotes = notes[i].notes;
				break;
			}
		}
		this.shownote(ntitle,ntarget,nnotes);
	},
	setnotes:	function() {
		// create new JSON Data Store from newly modified bookmarks object on localStorage
		var newstore = new Ext.data.JsonStore({
			data: this.getnotes(),
			root: 'notes',
			fields: ['notes','target','title']
		});
		var total = newstore.getTotalCount();
		Ext.getCmp("notespanel").setTitle("Notes ("+total+")");
		// call bindStore on ListView to change target data store
		Ext.getCmp('noteslist').bindStore(newstore);
	},
	shownote:		function(title,target,notes) {
		delegate_note("show",{title:title,target:target,notes:notes});
	},
	savenote:	function(title,target,notes) {
		// get notes object from localStorage
		var notesobj = this.getnotes().notes;
		// create new object for holding form field values; this will be added to notes array
		var note = {};
		note.notes = notes;
		note.title = title;
		note.target = target;
		var exists = false;
		var pos = "";
		// loop over notes object
		for(i=0;i<notesobj.length;i++) {
			// if the title matches an extant note, set exists to true and mark the position in the array
			if(notesobj[i].title==title) {
				exists = true;
				pos = i;
				//notes.splice(i,1,note);
				break;
			}
		}
		// if note exists already, replace it with new object
		if(exists) {
			showMessage("noteadd");
			notesobj.splice(pos,1,note);
		}
		// otherwise, add new note to end of notes array
		else {
			showMessage("noteadd");
			notesobj.push(note);
		}
		this.writenotes(notesobj);	
	},
	deletenote:	function(title,target) {
		var notesobj = this.getnotes().notes;
		for(i=0;i<notesobj.length;i++) {
			// loop over bookmarks; if title match is found, remove bookmark from array
			if(notesobj[i].title==title && notesobj[i].target==target) {
				notesobj.splice(i,1);
			}
		}
		this.writenotes(notesobj);	
	},
	writenotes: function(obj) {
		var notesobj = {notes:obj};
		this.glossdb.notes = Ext.encode(notesobj);	
		this.setnotes();
	},
	setnotifications:	function() {
		// create new JSON Data Store from newly modified bookmarks object on localStorage
		var newstore = new Ext.data.JsonStore({
			data: this.getnotifications(),
			root: 'news',
			fields: ['content','title','datereleased']
		});
		var total = newstore.getTotalCount();
		Ext.getCmp("notificationpanel").setTitle("Gloss News ("+total+")");
		// call bindStore on ListView to change target data store
		Ext.getCmp('notificationlist').bindStore(newstore);
	},
	getnotifications:	function() {
		var thenews = {news:glossnews};
		return thenews;
	},
	getnotification: function(title) {
		for(var i=0;i<glossnews.length;i++) {
			if(glossnews[i].title==title) {
				var r = glossnews[i];
				var title 	= r.title;
				var content	= r.content;
				var win = new Ext.Window({
					draggable: 	true,
					resizable: 	true,
					modal:		true, 
					layout:		"fit",
					title: 		title,
					items: 		[{html: content, padding:5}],
					width:		350,
					padding:	5,
					minHeight:	300,
					height:		300,
					frame:		true
				}).show();
				break;
			}
		}
	},
	runstartup: function() {
		// set flags for settings
		so.singleexpand = storage.singleexpand=="true" ? true : false;
		so.autoload 	 = storage.autoload=="true" ? true : false;
		so.autosearch	 = storage.autosearch=="true" ? true : false;
		// try to autoload last-visited page (if setting permits)
		if(storage.lastviewed && so.autoload) {
			var lv = Ext.decode(storage.lastviewed);
			loadURL(lv.target,lv.title);
		}
		else {
			loadURL("index.html","About this App");
		}	
	}
};
/***********************************************************************************
	END: GlossStorage
***********************************************************************************/

/***********************************************************************************
	BEGIN: Global Config
***********************************************************************************/
var glossdb = '';
var delegate = new Array();
var navitems = '';

var so = {autoload:true,singleexpand:true,autosearch:false};
// shortcut to storage
var storage = localStorage;
var sstorage= sessionStorage;

var haswebsql = typeof openDatabase == "function" ? true : false;
//haswebsql = false;
/***********************************************************************************
	END: Global Config
***********************************************************************************/

function delegate_history(data) {
	if(haswebsql) {
		sstorage.lastviewed=Ext.encode(data);
		glossdb.data.addhistory(data.title,data.target);
	}
	else {
		storage.lastviewed = Ext.encode(data);
	}
}

function delegate_startup() {
	if(haswebsql) {
		glossdb.data.runstartup();
	}
	else {
		glossdb.runstartup();
	}
}

/*************************************************************************************
	delegate_bookmark : handles action switching for different versions of application
	ARGUMENTS:	action (required): 	the action to execute
				data	(optional): object containing data to use in sub. calls
*************************************************************************************/
function delegate_bookmark(action,data) {
	switch(action) {
		case "add": 
			if(haswebsql) {
				glossdb.data.addbookmark();
			}
			else {
				glossdb.addbookmark();
			}
		break;
		case "delete":
			if(haswebsql) {
				glossdb.data.deletebookmark(data.title);
			}
			else {
				glossdb.deletebookmark(data.title);	
			}
			showMessage("bookmarkdelete");
		break;
	}
}
/*************************************************************************************
	delegate_bookmark : handles action switching for different versions of application
	ARGUMENTS:	action (required): 	the action to execute
				data	(optional): object containing data to use in sub. calls
*************************************************************************************/
function delegate_note(action,data) {
	switch(action) {
		case "get":
			if(haswebsql) {
				glossdb.data.getnote(data.title,data.target);	
			}
			else {
				glossdb.getnote(data.title,data.target);
			}
		break;
		case "show":
			// get references to EXT form elements for notes
			var fta = Ext.getCmp("notetextarea");
			var ftitle = Ext.getCmp("notetitle");
			var ftarget= Ext.getCmp("notetarget"); 
			var flabel = Ext.getCmp("notelabel");
			// get note window object
			var notewindow = Ext.getCmp("notewindow");
			// set the values of the form fields to the new values
			fta.setValue(data.notes);
			ftitle.setValue(data.title);
			ftarget.setValue(data.target);
			flabel.setText(data.title);
			// show the window
			notewindow.show();
		break;
		case "delete":
			if(haswebsql) {
				glossdb.data.deletenote(data.title,data.target);
			}
			else {
				glossdb.deletenote(data.title,data.target);
			}
			showMessage("notedelete");
		break;
		case "save":
			// get values of form fields
			var notes = Ext.getCmp("notetextarea").getValue();
			var title = Ext.getCmp("notetitle").getValue();
			var target= Ext.getCmp("notetarget").getValue(); 
			// get reference to notes window
			var notewindow = Ext.getCmp("notewindow");
			// hide notes window
			notewindow.hide();
			// show add message
			if(haswebsql) {
				glossdb.data.savenote(title,target,notes);		
			}
			else {
				glossdb.savenote(title,target,notes);	
			}
		break;
	}
}

function updateSettings(key,val) {
	if(val=='true') {val=true;}
	if(val=='false') {val=false;}
	so[key] = val;
	return so;
}
/*************************************************************************************
	loadComments() :Success callback for loadPage(); handles returned comments
	ARGUMENTS:	req (required):	The request object returned from remote request
				opts(required): Options sent along with original request
*************************************************************************************/
function loadComments(req,opts) {
	// create new JSON Data Store from returned comments object
	var newstore = new Ext.data.JsonStore({
		data: Ext.decode(req.responseText),
		root: 'comments',
		fields: ['description','author','pubdate']
	});
	var total = newstore.getTotalCount();
	Ext.getCmp("commentspanel").setTitle("Comments ("+total+")");
	// call bindStore on ListView to change target data store
	Ext.getCmp('commentslist').bindStore(newstore);
}
/*************************************************************************************
	showComments() :  This function handles the showing and hiding of the comments
					  panel
*************************************************************************************/
function showComments() {
	var cp  = Ext.getCmp("commentspanel");
	var img = Ext.getDom("comments-tool");
	if(cp.collapsed) {
		cp.expand();
		img.src = 'images/comments-color.png';
	}
	else {
		cp.collapse();
		img.src = 'images/comments.png';
	}
}					
/*************************************************************************************
	handleClick() : 	Just a delegating function; calls loadURL()
	ARGUMENTS:	el (required): object containing target and text info for link to load
*************************************************************************************/
function handleClick(el,e) {
	loadURL(el.attributes.target,el.text);
}
/*************************************************************************************
	handleSearch() : 	Just a delegating function for search clicks; calls loadURL()
	ARGUMENTS:	el (required): object containing target and text info for link to load
*************************************************************************************/
function handleSearch(dv,index,node,e) {
	var record = dv.getStore().getAt(index);
	loadURL(record.data.url,record.data.title);
}
/*************************************************************************************
	handleSearchKey() : 	Just a delegating function for search key events; calls loadURL()
	ARGUMENTS:	el (required): object containing target and text info for link to load
*************************************************************************************/
function handleSearchKey(e) {
	var grid = Ext.getCmp("searchlist");
	// if tab or down arrow
	if(e.keyCode==9 || e.keyCode==40) {
		// get row
		var id = (e.target.tabIndex - 1001)+1;
		// select the row in selection model
		grid.getSelectionModel().selectRow(id);
		if(e.keyCode==40) {
			e.preventDefault();
			Ext.getDom("div"+(e.target.tabIndex+1)).focus();	
		}
		return false;
	}
	if(e.keyCode == e.ENTER || e.keyCode == 32){
		// get row
		var id = e.target.tabIndex - 1001;
		// select the row in selection model
		grid.getSelectionModel().selectRow(id);
		// get the record from the grid's data store
		var record = grid.getSelectionModel().getSelected();
		// load up the record
		loadURL(record.data.url,record.data.title);
		e.preventDefault();	
		return false;
	}
}
/*************************************************************************************
	loadURL() :	Takes a URL and title and passes them to CFC to load URL content
	ARGUMENTS:	url (required):		the URL of the content to load
				title (required) : 	the title of the page whose content is requested
*************************************************************************************/
function loadURL(target,title) {
	// show pageload message
	showMessage("page");
	
	Ext.Ajax.request({
		url: "com/parser.cfc",
		params: {method:"loadPage",returnformat:"json",target:target,title:title},
		success: loadPage
	});
	Ext.Ajax.request({
		url: "com/comments.cfc",
		params: {method:"getComments",returnformat:"json",target:target,title:title},
		success: loadComments
	});
}
/*************************************************************************************
	loadPage() :Success callback for loadPage(); attaches returned content to page
	ARGUMENTS:	req (required):	The request object returned from remote request
				opts(required): Options sent along with original request
*************************************************************************************/
function loadPage(req,opts) {
	// get the result
	var result = Ext.decode(req.responseText);
	document.getElementById('body').innerHTML = result.content;
	
	var header = Ext.get("body").query("#content_wrapper h1")[0];
	var loc = window.location;
	
	if(result.target!='index.html') {
		Ext.DomHelper.append(header, [
			{tag:"a",html:"",cls:"anchor",href:loc.protocol + "//" + loc.host + loc.pathname + "?p=" + result.target.replace(".html",""),title:"Permanent link to this page"}
		]);
	}
	
	var anchors = Ext.get("body").query("*[href^=#W]");
	for(var i=0;i<anchors.length;i++) {
		var anc = Ext.get(anchors[i]);
		anc.on("click",	scrollPage);
	}
	var thebody = Ext.query('#bodypanel .x-panel-bwrap .x-panel-body')[0];
	if(thebody) {
		Ext.getDom(thebody).scrollTop = 0;
	}
	var lv = new Object();
	lv.title = result.title;
	lv.target = result.target;
	// invoke history delegate to store nav info
	delegate_history(lv);
	
	// if there's a hash mark in the url, fire window.location to register the action with the browser
	if(result.redirect!='') {
		var el = Ext.get(result.redirect.replace(/#/,''));
		var ct = Ext.query("#bodypanel .x-panel-body")[0];
		ct = Ext.get(ct);
		//el.scrollIntoView(Ext.get(ct));
		var yoffset = el.getOffsetsTo(ct)[1];
		ct.scrollTo("top",yoffset,true);
		//window.location.hash = result.redirect;
	}
	delegate = new Array();
	// if auto-search setting is set, start auto-search
	if(so.autosearch) {
		var srchfld = Ext.getCmp("searchfield");
		srchfld.setValue(result.title);
		getSearch(srchfld);
	}
	findNavItem(lv.title,lv.target);
}

/*************************************************************************************
	scrollPage(): handles in-context anchor tags; scrolls to content, rather than
				  using anchor jump
	ARGUMENTS:	e (auto): event object
*************************************************************************************/
function scrollPage(e,el,o) {
	// get the element we're basing the scroll on (the target)
	var el = Ext.get(this.dom.hash.replace(/#/,''));
	// get the container
	var ct = Ext.query("#bodypanel .x-panel-body")[0];
	ct = Ext.get(ct);
	// calculate y position of target element; this is how far we need to scroll
	var yoffset = el.getOffsetsTo(ct)[1];
	// do the scroll
	ct.scrollTo("top",yoffset,true);
	// call preventDefault on the original click event to prevent anchor jump
	e.preventDefault();
}

/*************************************************************************************
	findNavItem(): handler for retriving page id and parent id for selected page
	ARGUMENTS:	el (required):	title or id of page requested
*************************************************************************************/
function findNavItem(el,target) {
	Ext.Ajax.request({
		url: "com/parser.cfc",
		params: {method:"getPageID",returnformat:"json",identifier:el,target:target},
		success: manageNav
	});	
}
/*************************************************************************************
	manageNav(): function to build out array for auto-expanding navigation
	ARGUMENTS:	req (required):	 the request object
				opts (required): the options sent in the remote request
*************************************************************************************/
function manageNav(req,opts) {
	if(req.responseText=='') {
		return false;
	}
	// get the response from the server
	var result = Ext.decode(req.responseText);
	// set shortcut to the tree
	var tree = Ext.getCmp("doctree");
	// get rootnode for tree
	var root = tree.getRootNode();
	// try to get node from id
	var node = tree.getNodeById(result.id);
	// if node is matched, set it to selected
	if(typeof node!="undefined" && delegate.length<1) {
		// expand all parents of this item
		// clear delegate array
		delegate.splice(0,delegate.length);
		if(so.singleexpand) {
			// get ancestor nodes of this node
			var ancestors = getAncestorNodes(node);
			// collapse non-relevant nodes, except for ancestors
			collapseNodes(ancestors);
		}
		// select current node
		node.ensureVisible(function(){this.select()});		
	}
	// if node is not matched, we're going to go into some recursion to get parents and what not
	else {
		// if node is not matched, add to delegate array
		if(result.parent!="root") {
			// add id to the delegate array
			delegate.push(result.id);
			// recall findNavItem() to get parents
			findNavItem(result.parent,result.parenttarget);
		}
		// if node is matched, finish processing by calling finishNav()
		else {
			// create navitems array by reversing delegate array
			navitems = delegate.reverse();
			if(!node.isExpanded()) {
				// expand this parent node
				node.expand();
				// add event listener for expand action
				node.on("expand",finishNav);
			}
			else {
				finishNav();
			}
		}	
	}
}	
/*************************************************************************************
	finishNav(): iterates over navigation array and auto-expands navigation structure
*************************************************************************************/
function finishNav() {
	// shortcut to tree panel
	var tree = Ext.getCmp("doctree");
	// if there is more than one navigation item, start processing
	if(navitems.length>1) {
		// get node that matches the first item in the navitems array
		var node = tree.getNodeById(navitems[0]);
		// remove the first item from the navitems array
		navitems.splice(0,1);
		// if node has child nodes, set event listener to the "expand" event
		if(node.hasChildNodes()) {
			node.on("expand",finishNav);
		}
		// if node does not have child nodes, set event listener to the "insert" event
		else {
			node.on("insert",finishNav);
		}
		// expand the node
		node.expand();
		return false;
	}
	if(navitems.length==1) {
		// get node that matches the last remaining item in the navitems array
		var node = tree.getNodeById(navitems[0]);
		// select th enode
		node.select();
		// remove last item from navitems array
		navitems.splice(0,1);
		// clear out delegate array and create a new one in its place
		delegate = new Array();
		// if singleexpand config option is set, close other non-active nodes
		if(so.singleexpand) {
			// get ancestor nodes of this node
			var ancestors = getAncestorNodes(node);
			// collapse non-relevant nodes, except for ancestors
			collapseNodes(ancestors);
		}
		return false;
	}
}
function getAncestorNodes(node) {
	var tree = Ext.getCmp("doctree");
	var root = tree.getRootNode();
	var ancestors = new Array();
	node.bubble(
		function() {ancestors.push(this)}
	);
	return ancestors;
}
/*************************************************************************************
	expandParents(): recursively works up the tree to expand parent nodes
	ARGUMENTS: node: the node whose parent to check
*************************************************************************************/
function expandParents(node) {
	// set shortcut to the tree
	var tree = Ext.getCmp("doctree");
	// get rootnode for tree
	var root = tree.getRootNode();
	// if node is equal to root, stop iteration
	if(node==root) {
		return true;
	}
	// expand parent node
	node.parentNode.expand();
	// recall function to recurse up the tree
	expandParents(node.parentNode);
}
/*************************************************************************************
	collapseNodes(): collapses all open nodes that are not a part of the nodes
					 passed to function
	ARGUMENTS: nodes: the node that should not be collapsed
*************************************************************************************/
function collapseNodes(nodes) {
	// set shortcut to the tree
	var tree = Ext.getCmp("doctree");
	// get root
	var root = tree.getRootNode();
	// cascade over child nodes of root
	root.cascade(
		function() {
			if(nodes.indexOf(this)==-1) {
				this.collapse();
			}
		}
	);
}
/*************************************************************************************
	showEmail(): Handles displaying email form
*************************************************************************************/
function showEmail() {
	Ext.getCmp("emailwindow").show();
}
/*************************************************************************************
	sendEmail(): Handles sending email
*************************************************************************************/
function sendEmail() {
	var ewin = Ext.getCmp("emailwindow");
	var eemail=Ext.getCmp("emailaddress").getValue();
	var ename= Ext.getCmp("emailname").getValue();
	var ecomment = Ext.getCmp("emailcontent").getValue();
	Ext.Ajax.request({
		url: "com/email.cfc",
		method:"POST",
		params: {name:ename,email:eemail,comment:ecomment,method:"sendemail"},
		success: function() {
			Ext.Msg.alert("Notice","Thanks for your feedback!");
			Ext.getCmp("emailwindow").hide();
		}
	});
}


function getSearch(el,e) {
	if(el.getValue().length >= 3) {
		Ext.Ajax.request({
			url: "com/search.cfc",
			method:"POST",
			params: {method:"searchcontent",query:el.getValue(),returnformat:"json"},
			success: renderSearch
		});
	}
	else {
		Ext.getCmp("searchpanel").setTitle("Search");
		Ext.getCmp('searchlist').getStore().removeAll();
	}
}

function renderSearch(req,opts) {
	// create new JSON Data Store from newly modified bookmarks object on localStorage
	var newstore = new Ext.data.JsonStore({
		data: Ext.decode(req.responseText),
		root: 'search',
		fields: ['summary','title','url','row']
	});
	var total = newstore.getTotalCount();
	Ext.getCmp("searchpanel").setTitle("Search ("+total+" Results)");
	// call bindStore on ListView to change target data store
	var searchmodel = new Ext.grid.ColumnModel({
        defaults: {
            sortable: false
        },
        columns: [{
			id: 'title', 
			sortable: false, 
			dataIndex: 'title',
			width: 290,
			renderer: function(value, metaData, record, rowIndex, colIndex, store) {
				metaData.css = "search-header-alt";
				metaData.attr = "tabIndex="+ (1000+rowIndex+1) + " id=div"+ (1000+rowIndex+1);
				return value;
   			}
		}]
	});
	Ext.getCmp('searchlist').reconfigure(newstore,searchmodel);
}

function showMessage(type) {
	var msg = Ext.get("message");
	switch(type){
		case "bookmarkadd":
			var html = "Bookmark Saved!";
			msg.update(html);
		 	break;
		case "bookmarkdelete":
			var html = "Bookmark Deleted!";
			msg.update(html);
		 	break;
		case "page":
		  	var html = "Loading Page...";
			msg.update(html);
		  	break;
		case "noteadd":
		  	var html = "Note Saved!";
			msg.update(html);
		  	break;
		case "notedelete":
		  	var html = "Note Deleted!";
			msg.update(html);
		  	break;
		case "setting":
			var html = "Setting Saved!";
			msg.update(html);
			break;
	}
	msg.fadeIn({endOpacity:1,easing:'easeOut',duration:.5,stopFx:true}).pause(1).fadeOut({endOpacity:0,easing:'easeOut',duration:.5});
}

function bookmark() {
	delegate_bookmark("add");	
}
function getNote(title,target) {
	delegate_note("get",{title:title,target:target});
}