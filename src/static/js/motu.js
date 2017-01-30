$( document ).ready( function(){

    runCookies();

    // toggle mobile navigation
    $('.navbar-toggle').on('click', function (e) {

        var $button = $(e.currentTarget);
        var targetId = $button.data('target');

        $(targetId).toggleClass('collapse');

    });

    $( '.download-link' ).on( 'click', function ( e ) {

        if( isAnalyticsLoaded() ) {

            e.preventDefault();

            var $link = $( e.currentTarget );

            var href = $link.attr( 'href' );
            var videoId = $link.data( 'video-id' );

            ga('send', {
                hitType: 'event',
                eventCategory: 'Videos',
                eventAction: 'download',
                eventValue: videoId
            });

        }

    });

    // var options = {};

    // $('#exampleModalLong').modal(options);
    // https://v4-alpha.getbootstrap.com/components/modal/#via-javascript

    // https://jira.vpro.nl/browse/CCA-54
    // https://wiki.vpro.nl/pages/viewpage.action?pageId=56819757
    // https://wiki.vpro.nl/display/PRL/Online+formulieren+maken?focusedCommentId=67338300#comment-67338300


});

function  isAnalyticsLoaded () {
    return window.GoogleAnalyticsObject !== undefined;
}

function runCookies () {
    window.cookieconsent.initialise({

        "palette": {
            "popup": {
                "background": "#252e39"
            },
            "button": {
                "background": "#14a7d0"
            }
        },

        "theme": "edgeless",
        "position": "top",
        "static": true,
        "type": "opt-out",

        "onInitialise": function ( status ) {

            if ( this.options.type === 'opt-out' && this.hasConsented() ) {
                addAnalytics();
                addShareButtons();
            }
        },

        "onStatusChange": function( status, chosenBefore ) {

            if ( this.options.type === 'opt-out' && this.hasConsented() ) {
                addAnalytics();
                addShareButtons();
            }
        },

        "onRevokeChoice": function() {

            if ( this.options.type === 'opt-out' ) {
                addAnalytics();
                addShareButtons();
            }
        },
    });
}

function addAnalytics () {

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-7517467-67', 'auto');
    ga('send', 'pageview');
}


function addShareButtons () {

    /**
     * Facebook
     */
    (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.8";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    /**
     * Twitter
     */
    window.twttr = (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
        if (d.getElementById(id)) return t;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://platform.twitter.com/widgets.js";
        fjs.parentNode.insertBefore(js, fjs);

        t._e = [];
        t.ready = function(f) {
            t._e.push(f);
        };

        return t;
    }(document, "script", "twitter-wjs"));

    /**
     * LinkedIn
     */
    (function(d, s, id){
        var js;
        var fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "//platform.linkedin.com/in.js";
        fjs.parentNode.insertBefore(js, fjs);

    }(document, 'script', 'linkedin-share'))

}