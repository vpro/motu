from datetime import datetime

class TimeUtil():

	@staticmethod
	def SRTTimetoPrettyTime(t):
		x = datetime.strptime(t, '%H:%M:%S,%f')
		return x.strftime('%H:%M:%S')

	@staticmethod
	def SRTTimetoMillis(t):
		x = datetime.strptime(t, '%H:%M:%S,%f')
		return ((x.hour * 3600 + x.minute * 60 + x.second) * 1000) + int(str(x.microsecond)[0:3])

	@staticmethod
	def millisToPrettyTime(ms):
		h = m = s = 0
		while ms >= 3600000:
			h += 1
			ms -= 3600000
		while ms >= 60000:
			m += 1
			ms -= 60000
		while ms >= 1000:
			s += 1
			ms -= 1000
		return '%02d:%02d:%02d' % (h, m, s)