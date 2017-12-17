"use strict";

function renderDestination(destination) {
	$("#destination").text(destination);
}

function insertAfter(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function clearMessage() {
	$("#message").val("");
	return false;
}

function clearMessages() {
	$("#messages").html("");
}

function delHandler(event) {
	$(event.currentTarget).parent().remove();
}

function bind() {
	$("#send-button").click(sendMessage);
	$("#subscribe-button").click(doSubscribe);
	$("#connect-button").click(doConnect);
	$("#disconnect-button").click(doDisconnect);
}

function sendDisable() {
	$("#message").prop("disabled", true);
	$("#send-button").prop("disabled", true);
	$("#subscribe-button").prop("disabled", true);
	$("#receipt").prop("disabled", true);
}

function sendEnable() {
	$("#message").prop("disabled", false);
	$("#send-button").prop("disabled", false);
	$("#subscribe-button").prop("disabled", false);
	$("#receipt").prop("disabled", false);
}

function status(status) {
	$("#status").text(status);
}


function renderMessage(frame) {
	if (frame === '\n') {
		status("ALIVE");
		return;
	}

	let frameDiv = $("#hidden").create("div.frame");
	let cmd = frameDiv.create("div.cmd");
	cmd[0].innerText = frame.command;

	let del = frameDiv.create("button.close/span");
	del[0].innerHTML = "&times;";
	
	let table = cmd.parent().create("table.hdrs");
	for(let i in frame.headers) {
		let td = table.create("tr/td[2]");
		td[0].innerText = i + ":";
		td[1].innerText = frame.headers[i];
	}
	if (frame.body) frameDiv.create("p.text-primary").text(frame.body);
	del.parent().click(delHandler);

	$("#messages").prepend(frameDiv.detach()[0]);
}

function sendMessage() {
	doSend($("#message").val(), $("#receipt").prop('checked'));
	$("#message").val("");
	return false;
}

function renderXtompVer(xtompVer) {
	$("#xtompVer").text(xtompVer);
}

function renderStatus(message) {
	let statusEl = document.querySelectorAll("#status")[0];
	statusEl.innerText = message;
}

function formatUptime(up) {
	let now = new Date().getTime() / 1000;
	let uptime = now - up;
	if (uptime < 60) {
		return uptime + "s";
	}
	else if (uptime < (60 * 60)) {
		return Math.floor((uptime / 60)) + "m";
	}
	else if (uptime < (60 * 60 * 24)) {
		return Math.floor((uptime / (60 * 60))) + "h";
	}
	else if (uptime < (60 * 60 * 24 * 356)) {
		return Math.floor((uptime / (60 * 60 * 24))) + "d";
	}
	else {
		return Math.floor((uptime / (60 * 60 * 24 * 365))) + "y";
	}
}

function renderNginInfo(data) {
	if ( data.cc ) {
		$("#up").text(formatUptime(data.cc.up));
		$("#cc").text(data.cc.sz);
		$("#Σ").text(data.cc.Σ);
		$("#Σµ").text(data.cc.Σµ);
		let now = new Date();
		renderUsageData(now.getMinutes() + ":" + now.getSeconds(), data.cc.sz);
	}
	else if ( data.dest && $("#destination").text() === data.dest ) {
		renderDestinationInfo(data);
	}
	else if ( data.dest ) {
		// not showing this destination right now
	}
	else {
		$("#up").text('-');
		$("#cc").text('-');
		$("#Σ").text('-');
		$("#Σµ").text('-');
	}
	//renderStatus("data in: " + new Date());
}

function renderNginConfig(data) {
	let menu = $("#topic-menu");
	data.destinations.forEach( (destination) => {
		let a = menu.create("li/a.menu-item");
		a.text(destination.name);
	});
	bindMenu();
}

/**
 * @param d  {"sz":0,"q":0,"Δ":0,"Σ":0}
 */
function renderDestinationInfo(d) {
	if (d) {
		$("#dest-sz").text(d.sz);
		$("#dest-q").text(d.q);
		$("#dest-Δ").text(d.Δ);
		$("#dest-Σ").text(d.Σ);
	}
	else {
		$("#dest-sz").text('-');
		$("#dest-q").text('-');
		$("#dest-Δ").text('-');
		$("#dest-Σ").text('-');
	}
}

function renderDestinationConfig(c) {
	if (c) {
		$("#destination").text(c.name);
		if ( c.max_connections === -1 ) {
			$("#dest-max-sz").text("1000");
		} else {
			$("#dest-max-sz").text(c.max_connections);
		}
		if ( c.max_messages === -1 ) {
			$("#dest-max-q").text("100");
		} else {
			$("#dest-max-q").text(c.max_messages);
		}
	} else {
		$("#destination").text("");
		$("#dest-max").text("");
	}
}

function bindMenu() {
	let menuItems = $("#topic-menu");
	menuItems.click(menuHandler);
	$('#topic-menu a').css( 'cursor', 'pointer' );
}

function menuHandler(elem) {
	let destination = elem.target.innerText;
	document.location.hash = destination;
	changeDestination(destination);
}

var chart;
function renderUsage() {
	let ctx = document.getElementById('usage').getContext('2d');
	Chart.scaleService.updateScaleDefaults('linear', {
		ticks: {
			min: 0,
			beginAtZero : true,
		}
	});
	chart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
			datasets: [{
				label: "Concurrent Connections",
				backgroundColor: '#cfbb8baa',
				//backgroundColor: '#fff',
				borderColor: '#5b6032',
				data: [0,0,0,0,0,0,0,0,0,0],
			}]
		},
		options: {}
	});

}

function renderUsageData(label, data) {
	chart.data.labels.shift();
	chart.data.labels.push(label);
	chart.data.datasets[0].data.shift();
	chart.data.datasets[0].data.push(data);
	chart.update();
}
