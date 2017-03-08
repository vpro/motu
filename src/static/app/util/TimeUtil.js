import moment from 'moment';

const TimeUtil = {

	formatTime : function(t) {
		if(t == -1) {
			return '00:00:00';
		}
	    var pt = moment.duration(t * 1000);
	    var h = pt.hours() < 10 ? '0' + pt.hours() : pt.hours();
	    var m = pt.minutes() < 10 ? '0' + pt.minutes() : pt.minutes();
	    var s = pt.seconds() < 10 ? '0' + pt.seconds() : pt.seconds();
	    return h + ':' + m + ':' + s;
	},

	formatMillisToTime : function(millis) {
		if(millis == -1) {
			return '00:00:00';
		}
	    var pt = moment.duration(millis);
	    var h = pt.hours() < 10 ? '0' + pt.hours() : pt.hours();
	    var m = pt.minutes() < 10 ? '0' + pt.minutes() : pt.minutes();
	    var s = pt.seconds() < 10 ? '0' + pt.seconds() : pt.seconds();
	    return h + ':' + m + ':' + s;
	},

	formatMillisToPosterSecs : function(millis) {
		if(millis < 1) {
			return '0001';
		}
		var pt = moment.duration(millis);
		var secs = pt.seconds();
		if(secs < 1) {
			return '0001';
		}
		secs = secs + '';
		while(secs.length <4) {
			secs = '0' + secs;
		}
		return secs;
	},

	playerPosToMillis : function(sec) {//a double
		return parseInt(sec) * 1000;
	}

}

export default TimeUtil;