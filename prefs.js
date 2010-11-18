var active_feed_cat = false;

var init_params = new Array();

var caller_subop = false;
var hotkey_prefix = false;
var hotkey_prefix_pressed = false;

var color_picker_active = false;
var selection_disabled = false;
var mouse_is_down = false;

var seq = "";

function feedlist_callback2(transport) {

	try {	

		dijit.byId('feedConfigTab').attr('content', transport.responseText); 

		selectTab("feedConfig", true);

		if (caller_subop) {
			var tuple = caller_subop.split(":");
			if (tuple[0] == 'editFeed') {
				window.setTimeout('editFeed('+tuple[1]+')', 100);
			}				

			caller_subop = false;
		}
		notify("");
		remove_splash();

	} catch (e) {
		exception_error("feedlist_callback2", e);
	}
}

function filterlist_callback2(transport) {
	dijit.byId('filterConfigTab').attr('content', transport.responseText); 
	notify("");
	remove_splash();
}

function labellist_callback2(transport) {

	try {

		dijit.byId('labelConfigTab').attr('content', transport.responseText); 
		closeInfoBox();

		notify("");
		remove_splash();

	} catch (e) {
		exception_error("labellist_callback2", e);
	}
}

function userlist_callback2(transport) {
	try {
		dijit.byId('userConfigTab').attr('content', transport.responseText); 

		notify("");
		remove_splash();
	} catch (e) {
		exception_error("userlist_callback2", e);
	}
}

function prefslist_callback2(transport) {
	try {
		dijit.byId('genConfigTab').attr('content', transport.responseText); 

		notify("");
		remove_splash();
	} catch (e) {
		exception_error("prefslist_callback2", e);
	}
}

function notify_callback2(transport) {
	notify_info(transport.responseText);	 
}

function init_profile_inline_editor() {
	try {

		if ($("prefFeedCatList")) {
			var elems = $("prefFeedCatList").getElementsByTagName("SPAN");

			for (var i = 0; i < elems.length; i++) {
				if (elems[i].id && elems[i].id.match("FCATT-")) {
					var id = elems[i].id.replace("FCATT-", "");
						new Ajax.InPlaceEditor(elems[i],
						'backend.php?op=rpc&subop=saveprofile&id=' + id);
				}
			}
		}

	} catch (e) {
		exception_error("init_profile_inline_editor", e);
	}
}

function init_cat_inline_editor() {
	try {

		if ($("prefFeedCatList")) {
			var elems = $("prefFeedCatList").getElementsByTagName("SPAN");

			for (var i = 0; i < elems.length; i++) {
				if (elems[i].id && elems[i].id.match("FCATT-")) {
					var cat_id = elems[i].id.replace("FCATT-", "");
						new Ajax.InPlaceEditor(elems[i],
						'backend.php?op=pref-feeds&subop=editCats&action=save&cid=' + cat_id);
				}
			}
		}

	} catch (e) {
		exception_error("init_cat_inline_editor", e);
	}
}

function infobox_feed_cat_callback2(transport) {
	try {
		infobox_callback2(transport);
		init_cat_inline_editor();
	} catch (e) {
		exception_error("infobox_feed_cat_callback2", e);
	}
}

function updateFeedList(sort_key) {

	try {

	var feed_search = $("feed_search");
	var search = "";
	if (feed_search) { search = feed_search.value; }

	var slat = $("show_last_article_times");

	var slat_checked = false;
	if (slat) {
		slat_checked = slat.checked;
	}

	var query = "?op=pref-feeds" +
		"&sort=" + param_escape(sort_key) + 
		"&slat=" + param_escape(slat_checked) +
		"&search=" + param_escape(search);

	new Ajax.Request("backend.php", {
		parameters: query,
		onComplete: function(transport) { 
			feedlist_callback2(transport); 
		} });
	} catch (e) {
		exception_error("updateFeedList", e);
	}
}

function updateUsersList(sort_key) {

	try {

		var user_search = $("user_search");
		var search = "";
		if (user_search) { search = user_search.value; }
	
		var query = "?op=pref-users&sort="
			+ param_escape(sort_key) +
			"&search=" + param_escape(search);
	
		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				userlist_callback2(transport); 
			} });

	} catch (e) {
		exception_error("updateUsersList", e);
	}
}

function addFeed() {

	try {

		var link = $("fadd_link");
	
		if (link.value.length == 0) {
			alert(__("Error: No feed URL given."));
		} else if (!isValidURL(link.value)) {
			alert(__("Error: Invalid feed URL."));
		} else {
			notify_progress("Adding feed...");
	
			var query = "?op=pref-feeds&subop=add&from=tt-rss&feed_url=" +
				param_escape(link.value);
	
			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
						feedlist_callback2(transport);
					} });
	
			link.value = "";
	
		}

	} catch (e) {
		exception_error("addFeed", e);
	}

}

function addPrefProfile() {

	var profile = $("fadd_profile");

	if (profile.value.length == 0) {
		alert(__("Can't add profile: no name specified."));
	} else {
		notify_progress("Adding profile...");

		var query = "?op=rpc&subop=addprofile&title=" +	
			param_escape(profile.value);

		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
					editProfiles();
				} });

	}
}


function addFeedCat() {

	var cat = $("fadd_cat");

	if (cat.value.length == 0) {
		alert(__("Can't add category: no name specified."));
	} else {
		notify_progress("Adding feed category...");

		var query = "?op=pref-feeds&subop=editCats&action=add&cat=" +
			param_escape(cat.value);

		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
					infobox_feed_cat_callback2(transport);
				} });

		link.value = "";

	}
}

function addUser() {

	try {

		var login = prompt(__("Please enter login:"), "");
	
		if (login == null) { 
			return false;
		}
	
		if (login == "") {
			alert(__("Can't create user: no login specified."));
			return false;
		}
	
		notify_progress("Adding user...");
	
		var query = "?op=pref-users&subop=add&login=" +
			param_escape(login);
				
		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				userlist_callback2(transport); 
			} });

	} catch (e) {
		exception_error("addUser", e);
	}
}

function editUser(id, event) {

	try {
		if (!event || !event.ctrlKey) {

		notify_progress("Loading, please wait...");

		selectTableRows('prefUserList', 'none');
		selectTableRowById('UMRR-'+id, 'UMCHK-'+id, true);

		var query = "?op=pref-users&subop=edit&id=" +
			param_escape(id);

		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
					infobox_callback2(transport);
					document.forms['user_edit_form'].login.focus();	
				} });

		} else if (event.ctrlKey) {
			var cb = $('UMCHK-' + id);
			cb.checked = !cb.checked;
			toggleSelectRow(cb);
		}

	} catch (e) {
		exception_error("editUser", e);
	}
		
}

function editFilter(id, event) {

	try {

		if (!event || !event.ctrlKey) {

			notify_progress("Loading, please wait...", true);

			var query = "?op=pref-filters&subop=edit&id=" + 
				param_escape(id);
	
			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
						infobox_callback2(transport);
						document.forms['filter_edit_form'].reg_exp.focus();
					} });
		} else if (event.ctrlKey) {
			var cb = $('FICHK-' + id);
			cb.checked = !cb.checked;
			toggleSelectRow(cb);
		}

	} catch (e) {
		exception_error("editFilter", e);
	}
}

function editFeed(feed, event) {

	try {

		if (event && !event.ctrlKey) {

			notify_progress("Loading, please wait...");

//			selectTableRows('prefFeedList', 'none');	
//			selectTableRowById('FEEDR-'+feed, 'FRCHK-'+feed, true);
	
			var query = "?op=pref-feeds&subop=editfeed&id=" +
				param_escape(feed);
	
			new Ajax.Request("backend.php", {
				parameters: query,
				onComplete: function(transport) {
						infobox_callback2(transport);
						document.forms["edit_feed_form"].title.focus();
					} });

		} else if (event.ctrlKey) {
//			var cb = $('FRCHK-' + feed);
//			cb.checked = !cb.checked;
//			toggleSelectRow(cb);
		}


	} catch (e) {
		exception_error("editFeed", e);
	}
}

function getSelectedLabels() {
	return getSelectedTableRowIds("prefLabelList");
}

function getSelectedUsers() {
	return getSelectedTableRowIds("prefUserList");
}

function getSelectedFeeds() {
	var tree = dijit.byId("feedTree");
	var items = tree.model.getCheckedItems();
	var rv = [];

	items.each(function(item) {
		rv.push(tree.model.store.getValue(item, 'bare_id'));
	});

	return rv;
}

function getSelectedFilters() {
	var tree = dijit.byId("filterTree");
	var items = tree.model.getCheckedItems();
	var rv = [];

	items.each(function(item) {
		rv.push(tree.model.store.getValue(item, 'bare_id'));
	});

	return rv;

}

function getSelectedFeedCats() {
	return getSelectedTableRowIds("prefFeedCatList");
}


function removeSelectedLabels() {

	var sel_rows = getSelectedLabels();

	if (sel_rows.length > 0) {

		var ok = confirm(__("Remove selected labels?"));

		if (ok) {
			notify_progress("Removing selected labels...");
	
			var query = "?op=pref-labels&subop=remove&ids="+
				param_escape(sel_rows.toString());

			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
						labellist_callback2(transport);
					} });

		}
	} else {
		alert(__("No labels are selected."));
	}

	return false;
}

function removeSelectedUsers() {

	try {

		var sel_rows = getSelectedUsers();
	
		if (sel_rows.length > 0) {
	
			var ok = confirm(__("Remove selected users? Neither default admin nor your account will be removed."));
	
			if (ok) {
				notify_progress("Removing selected users...");
		
				var query = "?op=pref-users&subop=remove&ids="+
					param_escape(sel_rows.toString());
	
				new Ajax.Request("backend.php", {
					parameters: query,
					onComplete: function(transport) { 
						userlist_callback2(transport); 
					} });
	
			}
	
		} else {
			alert(__("No users are selected."));
		}

	} catch (e) {
		exception_error("removeSelectedUsers", e);
	}

	return false;
}

function removeSelectedFilters() {

	try {

		var sel_rows = getSelectedFilters();
	
		if (sel_rows.length > 0) {
	
			var ok = confirm(__("Remove selected filters?"));
	
			if (ok) {
				notify_progress("Removing selected filters...");
		
				var query = "?op=pref-filters&subop=remove&ids="+
					param_escape(sel_rows.toString());
	
				new Ajax.Request("backend.php",	{
						parameters: query,
						onComplete: function(transport) {
								filterlist_callback2(transport);
					} });
	
			}
		} else {
			alert(__("No filters are selected."));
		}

	} catch (e) {
		exception_error("removeSelectedFilters", e);
	}

	return false;
}


function removeSelectedFeeds() {

	try {

		var sel_rows = getSelectedFeeds();
	
		if (sel_rows.length > 0) {
	
			var ok = confirm(__("Unsubscribe from selected feeds?"));
	
			if (ok) {
	
				notify_progress("Unsubscribing from selected feeds...", true);
		
				var query = "?op=pref-feeds&subop=remove&ids="+
					param_escape(sel_rows.toString());

				console.log(query);

				new Ajax.Request("backend.php",	{
					parameters: query,
					onComplete: function(transport) {
						updateFeedList();
						} });
			}
	
		} else {
			alert(__("No feeds are selected."));
		}

	} catch (e) {
		exception_error("removeSelectedFeeds", e);
	}
	
	return false;
}

function clearSelectedFeeds() {

	var sel_rows = getSelectedFeeds();

	if (sel_rows.length > 1) {
		alert(__("Please select only one feed."));
		return;
	}

	if (sel_rows.length > 0) {

		var ok = confirm(__("Erase all non-starred articles in selected feed?"));

		if (ok) {
			notify_progress("Clearing selected feed...");
			clearFeedArticles(sel_rows[0]);
		}

	} else {

		alert(__("No feeds are selected."));

	}
	
	return false;
}

function purgeSelectedFeeds() {

	var sel_rows = getSelectedFeeds();

	if (sel_rows.length > 0) {

		var pr = prompt(__("How many days of articles to keep (0 - use default)?"), "0");

		if (pr != undefined) {
			notify_progress("Purging selected feed...");

			var query = "?op=rpc&subop=purge&ids="+
				param_escape(sel_rows.toString()) + "&days=" + pr;

			console.log(query);

			new Ajax.Request("prefs.php",	{
				parameters: query,
				onComplete: function(transport) {
					notify('');
				} });
		}

	} else {

		alert(__("No feeds are selected."));

	}
	
	return false;
}

function removeSelectedPrefProfiles() {

	var sel_rows = getSelectedFeedCats();

	if (sel_rows.length > 0) {

		var ok = confirm(__("Remove selected profiles? Active and default profiles will not be removed."));

		if (ok) {
			notify_progress("Removing selected profiles...");
	
			var query = "?op=rpc&subop=remprofiles&ids="+
				param_escape(sel_rows.toString());

			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
					editProfiles();
				} });
		}

	} else {
		alert(__("No profiles selected."));
	}

	return false;
}

function removeSelectedFeedCats() {

	var sel_rows = getSelectedFeedCats();

	if (sel_rows.length > 0) {

		var ok = confirm(__("Remove selected categories?"));

		if (ok) {
			notify_progress("Removing selected categories...");
	
			var query = "?op=pref-feeds&subop=editCats&action=remove&ids="+
				param_escape(sel_rows.toString());

			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
					infobox_feed_cat_callback2(transport);
				} });

		}

	} else {

		alert(__("No categories are selected."));

	}

	return false;
}

function feedEditCancel() {
	closeInfoBox();
	return false;
}

function feedEditSave() {

	try {
	
		// FIXME: add parameter validation

		var query = Form.serialize("edit_feed_form");

		notify_progress("Saving feed...");

		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				feedlist_callback2(transport); 
			} });

		closeInfoBox();

		return false;

	} catch (e) {
		exception_error("feedEditSave", e);
	} 
}

function userEditCancel() {
	closeInfoBox();
	return false;
}

function filterEditCancel() {
	closeInfoBox();
	return false;
}

function userEditSave() {

	try {

		var login = document.forms["user_edit_form"].login.value;
	
		if (login.length == 0) {
			alert(__("Login field cannot be blank."));
			return;
		}
		
		notify_progress("Saving user...");
	
		closeInfoBox();
	
		var query = Form.serialize("user_edit_form");
		
		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				userlist_callback2(transport); 
			} });
	
	} catch (e) {
		exception_error("userEditSave", e);
	}

	return false;

}


function filterEditSave() {
	try {
		var reg_exp = document.forms["filter_edit_form"].reg_exp.value;

		var query = "?op=rpc&subop=verifyRegexp&reg_exp=" + param_escape(reg_exp);

		notify_progress("Verifying regular expression...");

		new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
					handle_rpc_reply(transport);

					var response = transport.responseXML;

					if (response) {
						var s = response.getElementsByTagName("status")[0].firstChild.nodeValue;
	
						notify('');

						if (s == "INVALID") {
							alert("Match regular expression seems to be invalid.");
							return;
						} else {

							var query = "?" + Form.serialize("filter_edit_form");
					
							notify_progress("Saving filter...");
			
							Form.disable("filter_edit_form");

							new Ajax.Request("backend.php",	{
									parameters: query,
									onComplete: function(transport) {
											closeInfoBox();
											filterlist_callback2(transport);
								} });
						}
					}
			} });

	} catch (e) {
		exception_error("filterEditSave", e);
	}

	return false;
}


function editSelectedUser() {
	var rows = getSelectedUsers();

	if (rows.length == 0) {
		alert(__("No users are selected."));
		return;
	}

	if (rows.length > 1) {
		alert(__("Please select only one user."));
		return;
	}

	notify("");

	editUser(rows[0]);
}

function resetSelectedUserPass() {

	try {

		var rows = getSelectedUsers();
	
		if (rows.length == 0) {
			alert(__("No users are selected."));
			return;
		}
	
		if (rows.length > 1) {
			alert(__("Please select only one user."));
			return;
		}
	
		var ok = confirm(__("Reset password of selected user?"));
	
		if (ok) {
			notify_progress("Resetting password for selected user...");
		
			var id = rows[0];
		
			var query = "?op=pref-users&subop=resetPass&id=" +
				param_escape(id);
	
			new Ajax.Request("backend.php", {
				parameters: query,
				onComplete: function(transport) { 
					userlist_callback2(transport); 
				} });
	
		}

	} catch (e) {
		exception_error("resetSelectedUserPass", e);
	}
}

function selectedUserDetails() {

	try {

		var rows = getSelectedUsers();
	
		if (rows.length == 0) {
			alert(__("No users are selected."));
			return;
		}
	
		if (rows.length > 1) {
			alert(__("Please select only one user."));
			return;
		}
	
		notify_progress("Loading, please wait...");
	
		var id = rows[0];
	
		var query = "?op=pref-users&subop=user-details&id=" + id;

		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
					infobox_callback2(transport);
				} });
	} catch (e) {
		exception_error("selectedUserDetails", e);
	}
}


function editSelectedFilter() {
	var rows = getSelectedFilters();

	if (rows.length == 0) {
		alert(__("No filters are selected."));
		return;
	}

	if (rows.length > 1) {
		alert(__("Please select only one filter."));
		return;
	}

	notify("");

	editFilter(rows[0]);

}


function editSelectedFeed() {
	var rows = getSelectedFeeds();

	if (rows.length == 0) {
		alert(__("No feeds are selected."));
		return;
	}

	if (rows.length > 1) {
		return editSelectedFeeds();
	}

	notify("");

	editFeed(rows[0], {});

}

function editSelectedFeeds() {

	try {
		var rows = getSelectedFeeds();
	
		if (rows.length == 0) {
			alert(__("No feeds are selected."));
			return;
		}
	
		notify("");
	
		notify_progress("Loading, please wait...", true);
	
		var query = "?op=pref-feeds&subop=editfeeds&ids=" +
			param_escape(rows.toString());

		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
					infobox_callback2(transport);
				} });

	} catch (e) {
		exception_error("editSelectedFeeds", e);
	}
}

function piggie(enable) {
	if (enable) {
		console.log("I LOVEDED IT!");
		var piggie = $("piggie");

		Element.show(piggie);
		Position.Center(piggie);
		Effect.Puff(piggie);

	}
}

function opmlImport() {
	
	var opml_file = $("opml_file");

	if (opml_file.value.length == 0) {
		alert(__("No OPML file to upload."));
		return false;
	} else {
		notify_progress("Importing, please wait...", true);
		return true;
	}
}

function updateFilterList(sort_key) {
	try {

		var filter_search = $("filter_search");
		var search = "";
		if (filter_search) { search = filter_search.value; }
	
		var query = "?op=pref-filters&sort=" + 
			param_escape(sort_key) + 
			"&search=" + param_escape(search);

		new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
						filterlist_callback2(transport);
			} });

	} catch (e) {
		exception_error("updateFilterList", e);
	}

}

function updateLabelList(sort_key) {

	try {

		var label_search = $("label_search");
		var search = "";
		if (label_search) { search = label_search.value; }
	
		var query = "?op=pref-labels&sort=" + 
			param_escape(sort_key) +
			"&search=" + param_escape(search);
	
		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
				labellist_callback2(transport);
			} });

	} catch (e) {
		exception_error("updateLabelList", e);
	}
}

function updatePrefsList() {

	var query = "?op=pref-prefs";

	new Ajax.Request("backend.php", {
		parameters: query,
		onComplete: function(transport) { 
			prefslist_callback2(transport); 
		} });

}

function selectTab(id, noupdate, subop) {
	try {

		if (!noupdate) {

			console.log("selectTab: " + id + "(NU: " + noupdate + ")");
	
			notify_progress("Loading, please wait...");
	
			// close active infobox if needed
			closeInfoBox();
	
			// clean up all current selections, just in case
			active_feed_cat = false;

//			Effect.Fade("prefContent", {duration: 1, to: 0.01, 
//				queue: { position:'end', scope: 'FEED_TAB', limit: 1 } } );

			if (id == "feedConfig") {
				updateFeedList();
			} else if (id == "filterConfig") {
				updateFilterList();
			} else if (id == "labelConfig") {
				updateLabelList();
			} else if (id == "genConfig") {
				updatePrefsList();
			} else if (id == "userConfig") {
				updateUsersList();
			}

			var tab = dijit.byId(id + "Tab");
			dijit.byId("pref-tabs").selectChild(tab);

		}

		/* clean selection from all tabs */
	
		$$("#prefTabs div").invoke('removeClassName', 'Selected');

		/* mark new tab as selected */

		$(id + "Tab").addClassName("Selected");
	
	} catch (e) {
		exception_error("selectTab", e);
	}
}

function init_second_stage() {

	try {

		document.onkeydown = pref_hotkey_handler;
		document.onmousedown = mouse_down_handler;
		document.onmouseup = mouse_up_handler;

		caller_subop = getURLParam('subop');

		if (getURLParam("subopparam")) {
			caller_subop = caller_subop + ":" + getURLParam("subopparam");
		}

		loading_set_progress(60);

		notify("");

		dojo.addOnLoad(function() {

			var active_tab = getInitParam("prefs_active_tab");
			if (!$(active_tab+"Tab")) active_tab = "genConfig";
			if (!active_tab || active_tab == '0') active_tab = "genConfig";

			var http_tab = getURLParam('tab');

			if (http_tab) active_tab = http_tab;

			var tab = dijit.byId(active_tab + "Tab");

			if (tab) dijit.byId("pref-tabs").selectChild(tab);

			});

		setTimeout("hotkey_prefix_timeout()", 5*1000);
		remove_splash();

	} catch (e) {
		exception_error("init_second_stage", e);
	}
}

function init() {

	try {
	
		dojo.require("dijit.layout.TabContainer");
		dojo.require("dijit.layout.BorderContainer");
		dojo.require("dijit.layout.AccordionContainer");
		dojo.require("dijit.layout.ContentPane");
		dojo.require("dijit.Dialog");
		dojo.require("dijit.form.Button");
		dojo.require("dijit.form.TextBox");
		dojo.require("dijit.form.RadioButton");
		dojo.require("dijit.form.Select");
		dojo.require("dijit.Toolbar");
		dojo.require("dojo.data.ItemFileWriteStore");
		dojo.require("dijit.Tree");
		dojo.require("dijit.form.DropDownButton");
		dojo.require("dijit.form.Form");
		dojo.require("dijit.Menu");
		dojo.require("dijit.tree.dndSource");
		dojo.require("dijit.InlineEditBox");

		dojo.registerModulePath("lib", "..");
		dojo.registerModulePath("fox", "../..");

		dojo.require("lib.CheckBoxTree");
		dojo.require("fox.PrefFeedTree");
		dojo.require("fox.PrefFilterTree");

		loading_set_progress(30);

		var query = "?op=rpc&subop=sanityCheck";

		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				backend_sanity_check_callback(transport);
			} });

	} catch (e) {
		exception_error("init", e);
	}
}

function validatePrefsReset() {
	try {
		var ok = confirm(__("Reset to defaults?"));

		if (ok) {

			var query = Form.serialize("pref_prefs_form");
			query = query + "&subop=reset-config";
			console.log(query);

			new Ajax.Request("backend.php", {
				parameters: query,
				onComplete: function(transport) { 
					var msg = transport.responseText;
					if (msg.match("PREFS_THEME_CHANGED")) {
						window.location.reload();
					} else {
						notify_info(msg);
						selectTab();
					}
				} });

		}

	} catch (e) {
		exception_error("validatePrefsReset", e);
	}

	return false;

}


function pref_hotkey_handler(e) {
	try {

		var keycode;
		var shift_key = false;

		var cmdline = $('cmdline');

		try {
			shift_key = e.shiftKey;
		} catch (e) {

		}

		if (window.event) {
			keycode = window.event.keyCode;
		} else if (e) {
			keycode = e.which;
		}

		var keychar = String.fromCharCode(keycode);

		if (keycode == 27) { // escape
			if (Element.visible("hotkey_help_overlay")) {
				Element.hide("hotkey_help_overlay");
			}
			colorPickerHideAll();
			hotkey_prefix = false;
			closeInfoBox();
		} 

		var dialog = dijit.byId("infoBox");
		var dialog_visible = false;

		if (dialog)
			dialog_visible = Element.visible(dialog.domNode);

		if (dialog_visible || !hotkeys_enabled) {
			console.log("hotkeys disabled");
			return;
		}

		if (keycode == 16) return; // ignore lone shift
		if (keycode == 17) return; // ignore lone ctrl

		if ((keycode == 67 || keycode == 71) && !hotkey_prefix) {
			hotkey_prefix = keycode;

			var date = new Date();
			var ts = Math.round(date.getTime() / 1000);

			hotkey_prefix_pressed = ts;

			cmdline.innerHTML = keychar;
			Element.show(cmdline);

			console.log("KP: PREFIX=" + keycode + " CHAR=" + keychar);
			return;
		}

		if (Element.visible("hotkey_help_overlay")) {
			Element.hide("hotkey_help_overlay");
		}

		if (keycode == 13 || keycode == 27) {
			seq = "";
		} else {
			seq = seq + "" + keycode;
		}

		/* Global hotkeys */

		Element.hide(cmdline);

		if (!hotkey_prefix) {

			if ((keycode == 191 || keychar == '?') && shift_key) { // ?
				if (!Element.visible("hotkey_help_overlay")) {
					//Element.show("hotkey_help_overlay");
					Effect.Appear("hotkey_help_overlay", {duration : 0.3});
				} else {
					Element.hide("hotkey_help_overlay");
				}
				return false;
			}

			if (keycode == 191 || keychar == '/') { // /
				var search_boxes = new Array("label_search", 
					"feed_search", "filter_search", "user_search", "feed_browser_search");

				for (var i = 0; i < search_boxes.length; i++) {
					var elem = $(search_boxes[i]);
					if (elem) {
						$(search_boxes[i]).focus();
						return false;
					}
				}
			}
		}

		/* Prefix c */

		if (hotkey_prefix == 67) { // c
			hotkey_prefix = false;

			if (keycode == 70) { // f
				quickAddFilter();
				return false;
			}

			if (keycode == 83) { // s
				quickAddFeed();
				return false;
			}

			if (keycode == 85) { // u
				// no-op
			}

			if (keycode == 67) { // c
				editFeedCats();
				return false;
			}

			if (keycode == 84 && shift_key) { // T
				displayDlg('feedBrowser');
				return false;
			}

		}

		/* Prefix g */

		if (hotkey_prefix == 71) { // g

			hotkey_prefix = false;

			if (keycode == 49 && $("genConfigTab")) { // 1
				selectTab("genConfig");
				return false;
			}

			if (keycode == 50 && $("feedConfigTab")) { // 2
				selectTab("feedConfig");
				return false;
			}

			if (keycode == 51 && $("filterConfigTab")) { // 4
				selectTab("filterConfig");
				return false;
			}

			if (keycode == 52 && $("labelConfigTab")) { // 5
				selectTab("labelConfig");
				return false;
			}

			if (keycode == 53 && $("userConfigTab")) { // 6
				selectTab("userConfig");
				return false;
			}

			if (keycode == 88) { // x
				return gotoMain();
			}

		}

		if ($("piggie")) {
			if (seq.match("8073717369")) {
				seq = "";
				piggie(true);
			} else {
				piggie(false);
			}
		}

		if (hotkey_prefix) {
			console.log("KP: PREFIX=" + hotkey_prefix + " CODE=" + keycode + " CHAR=" + keychar);
		} else {
			console.log("KP: CODE=" + keycode + " CHAR=" + keychar);
		}

	} catch (e) {
		exception_error("pref_hotkey_handler", e);
	}
}

function editFeedCats() {
	try {
		var query = "?op=pref-feeds&subop=editCats";

		notify_progress("Loading, please wait...");

		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
				infobox_feed_cat_callback2(transport);
			} });
	} catch (e) {
		exception_error("editFeedCats", e);
	}
}

function showFeedsWithErrors() {
	displayDlg('feedUpdateErrors');
}

function changeUserPassword() {

	try {

		var f = document.forms["change_pass_form"];

		if (f) {
			if (f.OLD_PASSWORD.value == "") {
				new Effect.Highlight(f.OLD_PASSWORD);
				notify_error("Old password cannot be blank.");
				return false;
			}

			if (f.NEW_PASSWORD.value == "") {
				new Effect.Highlight(f.NEW_PASSWORD);
				notify_error("New password cannot be blank.");
				return false;
			}

			if (f.CONFIRM_PASSWORD.value == "") {
				new Effect.Highlight(f.CONFIRM_PASSWORD);
				notify_error("Entered passwords do not match.");
				return false;
			}

			if (f.CONFIRM_PASSWORD.value != f.NEW_PASSWORD.value) {
				new Effect.Highlight(f.CONFIRM_PASSWORD);
				new Effect.Highlight(f.NEW_PASSWORD);
				notify_error("Entered passwords do not match.");
				return false;
			}

		}

		var query = Form.serialize("change_pass_form");
	
		notify_progress("Changing password...");

		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				if (transport.responseText.indexOf("ERROR: ") == 0) {
					notify_error(transport.responseText.replace("ERROR: ", ""));
				} else {
					notify_info(transport.responseText);
					var warn = $("default_pass_warning");
					if (warn) warn.style.display = "none";
				}
		
				document.forms['change_pass_form'].reset();
			} });


	} catch (e) {
		exception_error("changeUserPassword", e);
	}
	
	return false;
}

function changeUserEmail() {

	try {

		var query = Form.serialize("change_email_form");
	
		notify_progress("Saving...");
	
		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				notify_callback2(transport); 
			} });

	} catch (e) {
		exception_error("changeUserPassword", e);
	}
	
	return false;

}

function feedlistToggleSLAT() {
	notify_progress("Loading, please wait...");
	updateFeedList()
}

function opmlRegenKey() {

	try {
		var ok = confirm(__("Replace current OPML publishing address with a new one?"));
	
		if (ok) {
	
			notify_progress("Trying to change address...", true);
	
			var query = "?op=rpc&subop=regenOPMLKey";
	
			new Ajax.Request("backend.php", {
				parameters: query,
				onComplete: function(transport) {
						var new_link = transport.responseXML.getElementsByTagName("link")[0];
	
						var e = $('pub_opml_url');
	
						if (new_link) {
							e.href = new_link.firstChild.nodeValue;
							e.innerHTML = new_link.firstChild.nodeValue;
	
							new Effect.Highlight(e);

							notify('');
	
						} else {
							notify_error("Could not change feed URL.");
						}
				} });
		}
	} catch (e) {
		exception_error("opmlRegenKey", e);
	}
	return false;
}
function validatePrefsSave() {
	try {

		var ok = confirm(__("Save current configuration?"));

		if (ok) {

			var query = Form.serialize("pref_prefs_form");
			query = query + "&subop=save-config";
			console.log(query);

			new Ajax.Request("backend.php", {
				parameters: query,
				onComplete: function(transport) { 
					var msg = transport.responseText;
					if (msg.match("PREFS_THEME_CHANGED")) {
						window.location.reload();
					} else {
						notify_info(msg);
					}
			} });

		}

	} catch (e) {
		exception_error("validatePrefsSave", e);
	}

	return false;
}

function feedActionChange() {
	try {
		var chooser = $("feedActionChooser");
		var opid = chooser[chooser.selectedIndex].value;

		chooser.selectedIndex = 0;
		feedActionGo(opid);
	} catch (e) {
		exception_error("feedActionChange", e);
	}
}

function feedActionGo(op) {	
	try {
		if (op == "facEdit") {

			var rows = getSelectedFeeds();

			if (rows.length > 1) {
				editSelectedFeeds();
			} else {
				editSelectedFeed();
			}
		}

		if (op == "facClear") {
			clearSelectedFeeds();
		}

		if (op == "facPurge") {
			purgeSelectedFeeds();
		}

		if (op == "facEditCats") {
			editFeedCats();
		}

		if (op == "facRescore") {
			rescoreSelectedFeeds();
		}

		if (op == "facUnsubscribe") {
			removeSelectedFeeds();
		}

	} catch (e) {
		exception_error("feedActionGo", e);

	}
}

function clearFeedArticles(feed_id) {

	notify_progress("Clearing feed...");

	var query = "?op=pref-feeds&quiet=1&subop=clear&id=" + feed_id;

	new Ajax.Request("backend.php",	{
		parameters: query,
		onComplete: function(transport) {
				notify('');
			} });

	return false;
}

function rescoreSelectedFeeds() {

	var sel_rows = getSelectedFeeds();

	if (sel_rows.length > 0) {

		//var ok = confirm(__("Rescore last 100 articles in selected feeds?"));
		var ok = confirm(__("Rescore articles in selected feeds?"));

		if (ok) {
			notify_progress("Rescoring selected feeds...", true);
	
			var query = "?op=pref-feeds&subop=rescore&quiet=1&ids="+
				param_escape(sel_rows.toString());

			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
						notify_callback2(transport);
			} });

		}
	} else {
		alert(__("No feeds are selected."));
	}

	return false;
}

function rescore_all_feeds() {
	var ok = confirm(__("Rescore all articles? This operation may take a lot of time."));

	if (ok) {
		notify_progress("Rescoring feeds...", true);

		var query = "?op=pref-feeds&subop=rescoreAll&quiet=1";

		new Ajax.Request("backend.php",	{
			parameters: query,
			onComplete: function(transport) {
					notify_callback2(transport);
		} });
	}
}

function removeFilter(id, title) {

	try {

		var msg = __("Remove filter %s?").replace("%s", title);
	
		var ok = confirm(msg);
	
		if (ok) {
			closeInfoBox();
	
			notify_progress("Removing filter...");
		
			var query = "?op=pref-filters&subop=remove&ids="+
				param_escape(id);

			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
						filterlist_callback2(transport);
			} });

		}

	} catch (e) {
		exception_error("removeFilter", e);
	}

	return false;
}

function feedsEditSave() {
	try {

		var ok = confirm(__("Save changes to selected feeds?"));

		if (ok) {

			var f = document.forms["batch_edit_feed_form"];

			var query = Form.serialize("batch_edit_feed_form");

			/* Form.serialize ignores unchecked checkboxes */

			if (!query.match("&rtl_content=") && 
					f.rtl_content.disabled == false) {
				query = query + "&rtl_content=false";
			}

			if (!query.match("&private=") && 
					f.private.disabled == false) {
				query = query + "&private=false";
			}

			if (!query.match("&cache_images=") && 
					f.cache_images.disabled == false) {
				query = query + "&cache_images=false";
			}

			if (!query.match("&include_in_digest=") && 
					f.include_in_digest.disabled == false) {
				query = query + "&include_in_digest=false";
			}
	
			closeInfoBox();
	
			notify_progress("Saving feeds...");
	
			new Ajax.Request("backend.php", {
				parameters: query,
				onComplete: function(transport) { 
					feedlist_callback2(transport); 
				} });

		}

		return false;
	} catch (e) {
		exception_error("feedsEditSave", e);
	}
}

function batchFeedsToggleField(cb, elem, label) {
	try {
		var f = document.forms["batch_edit_feed_form"];
		var l = $(label);

		if (cb.checked) {
			f[elem].disabled = false;

			if (l) {
				l.className = "";
			};

//			new Effect.Highlight(f[elem], {duration: 1, startcolor: "#fff7d5",
//				queue: { position:'end', scope: 'BPEFQ', limit: 1 } } );

		} else {
			f[elem].disabled = true;

			if (l) {
				l.className = "insensitive";
			};

		}
	} catch (e) {
		exception_error("batchFeedsToggleField", e);
	}
}

function labelColorReset() {
	try {
		var labels = getSelectedLabels();

		var ok = confirm(__("Reset label colors to default?"));

		if (ok) {

			var query = "?op=pref-labels&subop=color-reset&ids="+
				param_escape(labels.toString());

			new Ajax.Request("backend.php", {
				parameters: query,
				onComplete: function(transport) {
						labellist_callback2(transport);
					} });
		}

	} catch (e) {
		exception_error("labelColorReset", e);
	}
}

function labelColorAsk(id, kind) {
	try {

		var p = null

		if (kind == "fg") {
			p = prompt(__("Please enter new label foreground color:"));
		} else {
			p = prompt(__("Please enter new label background color:"));
		}

		if (p != null) {

			var query = "?op=pref-labels&subop=color-set&kind=" + kind +
				"&ids="+	param_escape(id) + "&color=" + param_escape(p);

			selectTableRows('prefLabelList', 'none');

			var e = $("LICID-" + id);

			if (e) {		
				if (kind == "fg") {
					e.style.color = p
				} else {
					e.style.backgroundColor = p;
				}
			}

			new Ajax.Request("backend.php", { parameters: query });
		}

	} catch (e) {
		exception_error("labelColorReset", e);
	}
}


function colorPicker(id, fg, bg) {
	try {
		var picker = $("colorPicker-" + id);

		if (picker) Element.show(picker);

	} catch (e) {
		exception_error("colorPicker", e);
	}
}

function colorPickerHideAll() {
	try {
		if ($("prefLabelList")) {

			var elems = $("prefLabelList").getElementsByTagName("DIV");

			for (var i = 0; i < elems.length; i++) {
				if (elems[i].id && elems[i].id.match("colorPicker-")) {
					Element.hide(elems[i]);
				}
			}
		}

	} catch (e) {
		exception_error("colorPickerHideAll", e);
	}
}

function colorPickerDo(id, fg, bg) {
	try {

		var query = "?op=pref-labels&subop=color-set&kind=both"+
			"&ids=" + param_escape(id) + "&fg=" + param_escape(fg) + 
			"&bg=" + param_escape(bg);

		var e = $("LICID-" + id);

		if (e) {		
			e.style.color = fg;
			e.style.backgroundColor = bg;
		}

		new Ajax.Request("backend.php", { parameters: query });

	} catch (e) {
		exception_error("colorPickerDo", e);
	}
}

function colorPickerActive(b) {
	color_picker_active = b;
}

function mouse_down_handler(e) {
	try {

		/* do not prevent right click */
		if (e && e.button && e.button == 2) return;

		if (selection_disabled) {
			document.onselectstart = function() { return false; };
			return false;
		}

	} catch (e) {
		exception_error("mouse_down_handler", e);
	}
}

function mouse_up_handler(e) {
	try {
		mouse_is_down = false;

		if (!selection_disabled) {
			document.onselectstart = null;
		}

		if (!color_picker_active) {
			colorPickerHideAll();
		}

	} catch (e) {
		exception_error("mouse_up_handler", e);
	}
}

function inPreferences() {
	return true;
}

function editProfiles() {
	displayDlg('editPrefProfiles', false, function() {
		init_profile_inline_editor();			
			});
}

function activatePrefProfile() {

	var sel_rows = getSelectedFeedCats();

	if (sel_rows.length == 1) {

		var ok = confirm(__("Activate selected profile?"));

		if (ok) {
			notify_progress("Loading, please wait...");
	
			var query = "?op=rpc&subop=setprofile&id="+
				param_escape(sel_rows.toString());

			new Ajax.Request("backend.php",	{
				parameters: query,
				onComplete: function(transport) {
					window.location.reload();
				} });
		}

	} else {
		alert(__("Please choose a profile to activate."));
	}

	return false;
}

function opmlImportDone() {
	closeInfoBox();
	updateFeedList();
}

function opmlImportHandler(iframe) {
	try {
		var tmp = new Object();
		tmp.responseText = iframe.document.body.innerHTML;
		notify('');
		infobox_callback2(tmp);
	} catch (e) {
		exception_error("opml_import_handler", e);
	}
}

function clearFeedAccessKeys() {

	var ok = confirm(__("This will invalidate all previously generated feed URLs. Continue?"));

	if (ok) {
		notify_progress("Clearing URLs...");

		var query = "?op=rpc&subop=clearKeys";

		new Ajax.Request("backend.php", {
			parameters: query,
			onComplete: function(transport) { 
				notify_info("Generated URLs cleared.");
			} });
	}
	
	return false;
}

function handle_rpc_reply(transport, scheduled_call) {
	try {
		if (transport.responseXML) {

			if (!transport_error_check(transport)) return false;

		} else {
			notify_error("Error communicating with server.");
		}

	} catch (e) {
		exception_error("handle_rpc_reply", e, transport);
	}

	return true;
}

function resetFeedOrder() {
	try {
		notify_progress("Loading, please wait...");

		new Ajax.Request("backend.php", {
			parameters: "?op=pref-feeds&subop=feedsortreset",
			onComplete: function(transport) {
		  		updateFeedList();	
			} });


	} catch (e) {
		exception_error("resetFeedOrder");
	}
}

function resetCatOrder() {
	try {
		notify_progress("Loading, please wait...");

		new Ajax.Request("backend.php", {
			parameters: "?op=pref-feeds&subop=catsortreset",
			onComplete: function(transport) {
		  		updateFeedList();	
			} });


	} catch (e) {
		exception_error("resetCatOrder");
	}
}

function editCat(id, item, event) {
	try {
		var new_name = prompt(__('Rename category to:'), item.name);

		if (new_name && new_name != item.name) {

			notify_progress("Loading, please wait...");

			new Ajax.Request("backend.php", {
			parameters: {
				op: 'pref-feeds', 
				subop: 'renamecat',
				id: id,
				title: new_name,
			},
			onComplete: function(transport) {
		  		updateFeedList();	
			} });
		}

	} catch (e) {
		exception_error("editCat", e);
	}
}
