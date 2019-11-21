/**
 * Extends the third-party jQuery Tools DatePicker widget to be internationalized
 * with Mozu text labels.
 */

require(['shim!vendor/jquery.tools.dateinput[modules/jquery-mozu=jquery]>jQuery', 'underscore', 'hyprlive'], function ($jQuery, _, Hypr) {
    var months = 'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
        days = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(',');

    var locale = (navigator.language || "en-US").split('-').shift();
    $jQuery.tools.dateinput.conf.locale = locale;
    $jQuery.tools.dateinput.localize(locale, {
        months: _.map(months, function (month) {
            return Hypr.getLabel(month.toLowerCase());
        }).join(','),
        shortMonths: _.map(months, function (month) {
            return Hypr.getLabel('short' + month);
        }).join(','),
        days: _.map(days, function (day) {
            return Hypr.getLabel(day.toLowerCase());
        }).join(','),
        shortDays: _.map(days, function (day) {
            return Hypr.getLabel('short' + day);
        }).join(',')
    });
});
