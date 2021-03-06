// schema generated with http://jsonschema.net
// todo: look at using typson to generate schema from a ts definition file: https://github.com/lbovet/typson

$(function(){

    var config, editor;

    function loadViewer() {

        // todo: update embed.js to work with script loaders.
        if (window.initPlayers && window.easyXDM){
            initPlayers($('.uv'));
        } else {
            setTimeout(loadViewer, 100);
        }

    }

    function loadConfigSchema(callback) {
        $.getJSON('config-schema.json', function(data){
            schema = data;
            callback();
        });
    }

    function loadManifests(callback) {
        if (isLocalhost){
            manifestsUri = "/examples/manifests.json";
        } else {
            manifestsUri = "/manifests.json";
        }

        // load manifests
        $.getJSON(manifestsUri, function(manifests){

            var $manifestSelect = $('#manifestSelect');

            for (var i = 0; i < manifests.length; i++) {
                var group = manifests[i];

                $manifestSelect.append('<optgroup label="' + group.title + '">');

                for (var j = 0; j < group.manifests.length; j++){
                    var manifest = group.manifests[j];

                    $manifestSelect.append('<option value="' + manifest.uri + '">' + manifest.title + '</option>');
                }

                $manifestSelect.append('</optgroup>');
            }

            callback();
        });
    }

    function isIE8(){
        return (browserDetect.browser === "Explorer" && browserDetect.version === 8);
    }

    function createEditor() {

        if (isIE8() || typeof(JSONEditor) === "undefined") {
            $("#edit-config").hide();
            return;
        }

        editor = new JSONEditor(document.getElementById('editor'),{
            form_name_root: "",
            theme: 'foundation5',
            iconlib: 'fontawesome4',
            schema: schema,
            disable_edit_json: false,
            disable_properties: true,
            required_by_default: true
        });

        editor.on('change', function() {
            // Get an array of errors from the validator
            var errors = editor.validate();

            // Not valid
            if(errors.length) {
                console.log(errors);
            }
        });
    }

    function buildQuerystring() {

        var jsonp = $('#jsonp').is(':checked');
        var testids = $('#testids').is(':checked');
        var defaultToFullScreen = $('#defaultToFullScreen').is(':checked');
        var manifest = $('#manifest').val();
        var locale = $('#locales').val() || "en-GB";

        // clear hash params
        document.location.hash = "";

        var qs = document.location.search.replace('?', '');
        qs = updateURIKeyValuePair(qs, "jsonp", jsonp);
        qs = updateURIKeyValuePair(qs, "testids", testids);
        qs = updateURIKeyValuePair(qs, "defaultToFullScreen", defaultToFullScreen);
        qs = updateURIKeyValuePair(qs, "manifest", manifest);
        qs = updateURIKeyValuePair(qs, "locale", locale);

        // reload
        window.location.search = qs;
    }

    function getLocale() {
        return getDefaultLocale($('#locales').val());
    }

    function getDefaultLocale(l) {
        var parsed = [];
        var l = l.split(',');

        for (var i = 0; i < l.length; i++) {
            var v = l[i].split(':');
            parsed.push({
                name: v[0],
                label: (v[1]) ? v[1] : ""
            });
        }

        return parsed[0].name;
    }

    function setJSONPEnabled() {

        var jsonp = $('#jsonp').is(':checked');

        var qs = getQuerystringParameter("jsonp");

        if (qs === 'false'){
            jsonp = false;
        } else if (qs === 'true') {
            jsonp = true;
        }

        if (jsonp){
            $('.uv').attr('data-jsonp', 'true');
            $('#jsonp').attr('checked', 'true');
        } else {
            $('.uv').removeAttr('data-jsonp');
            $('#jsonp').removeAttr('checked');
        }
    }

    function setSelectedManifest(){

        var manifest = getQuerystringParameter("manifest");

        if (manifest) {
            $("#manifestSelect").val(manifest);
        } else {
            var options = $('#manifestSelect option');

            if (options.length){
                manifest = options[0].value;
            }
        }

        $("#manifest").val(manifest);

        $('.uv').attr('data-uri', manifest);
    }

    // called when the page loads to set the initial data-locale
    function setInitialLocale() {
        var locale = getQuerystringParameter("locale");
        if (locale){
            $('.uv').attr('data-locale', locale);
        }
    }

    // called when the UV loads to set
    // the locale options
    function setSelectedLocale(locale) {
        $("#locale").val(getDefaultLocale(locale));

        $("#locales").val(locale);
    }

    function setTestIds(){
        //var testids = $('#testids').is(':checked');

        var qs = getQuerystringParameter("testids");

        if (qs === 'true') {
            createTestIds();
            $('#testids').attr('checked', 'true');
        } else {
            $('#testids').removeAttr('checked');
        }
    }

    function setDefaultToFullScreen(){
        var defaultToFullScreen = $('#defaultToFullScreen').is(':checked');

        var qs = getQuerystringParameter("defaultToFullScreen");

        if (qs === 'true') {
            $('.uv').attr('data-fullscreen', true);
            $('#defaultToFullScreen').attr('checked', 'true');
        } else {
            $('.uv').removeAttr('data-fullscreen');
            $('#defaultToFullScreen').removeAttr('checked');
        }
    }

    function openEditor() {
        var configName = config.name + '.' + getLocale();
        var configDisplayName = configName;

        var sessionConfig = sessionStorage.getItem("uv-config-" + getLocale());

        if (sessionConfig){
            config = JSON.parse(sessionConfig);
            configDisplayName += "*";
            $('.config-name').text('(' + configDisplayName + ')');
            showEditor();
            editor.setValue(config);
        } else {
            $.getJSON('/build/uv-1.2.1/js/' + configName + '.config.js', function(config){
                $('.config-name').text('(' + configDisplayName + ')');
                showEditor();
                editor.setValue(config);
            });
        }
    }

    function showEditor() {
        $('#editPnl').swapClass('hide', 'show');
        $('#saveBtn').swapClass('hide', 'show');
        $('#resetBtn').swapClass('show', 'hide');
        $('#editBtn').swapClass('show', 'hide');
        $('#closeBtn').swapClass('hide', 'show');
    }

    function closeEditor() {
        $('.config-name').empty();
        $('#editPnl').swapClass('show', 'hide');
        $('#saveBtn').swapClass('show', 'hide');
        $('#resetBtn').swapClass('hide', 'show');
        $('#editBtn').swapClass('hide', 'show');
        $('#closeBtn').swapClass('show', 'hide');
    }

    function init() {
        if (isLocalhost){
            if (!scriptIncluded) $("body").append('<script type="text/javascript" id="embedUV" src="/src/js/embed.js"><\/script>');
        } else {
            // built version

            // remove '/examples' from paths
            $('.uv').updateAttr('data-config', '/examples/', '/');

            $('.uv').updateAttr('data-uri', '/examples/', '/');

            $('#locale option').each(function() {
                $(this).updateAttr('value', '/examples/', '/');
            });

            $('#manifestSelect option').each(function() {
                $(this).updateAttr('value', '/examples/', '/');
            });

            $("body").append('<script type="text/javascript" id="embedUV" src="/build/uv-1.2.1/js/embed.js"><\/script>');
        }

        $('#setOptionsBtn').on('click', function(e){
            e.preventDefault();
            buildQuerystring();
        });

        $('#manifestSelect').on('change', function(){
            $('#manifest').val($('#manifestSelect option:selected').val());
        });

        $('#setManifestBtn').on('click', function(e){
            e.preventDefault();
            buildQuerystring();
        });

        $('#locale').on('change', function(){
            $('#locales').val($('#locale option:selected').val());
        });

        $('#setLocalesBtn').on('click', function(e){
            e.preventDefault();
            buildQuerystring();
        });

        $('#resetLocalesBtn').on('click', function(e){
            e.preventDefault();
            $('#locale').text("");
            $('.uv').removeAttr('data-locale');
            buildQuerystring();
        });

        $('#editBtn').on('click', function(e) {
            e.preventDefault();

            openEditor();
        });

        $('#closeBtn').on('click', function(e) {
            e.preventDefault();

            closeEditor();
        });

        $('#saveBtn').on('click', function(e) {
            e.preventDefault();

            var errors = editor.validate();

            if(errors.length) {
                console.log(errors);
                return;
            }

            // save contents of #json to session storage, set data-config attribute to 'sessionstorage' and reload viewer
            sessionStorage.setItem("uv-config-" + getLocale(), JSON.stringify(editor.getValue()));

            $('.uv').attr('data-config', 'sessionstorage');

            loadViewer();
        });

        $('#resetBtn').on('click', function(e){
            e.preventDefault();

            $('.uv').removeAttr('data-config');

            sessionStorage.clear();

            loadViewer();
        });

        $(document).bind("uv.onToggleFullScreen", function (event, obj) {
            console.log('full screen: ' + obj.isFullScreen);
        });

        $(document).bind("uv.onSequenceIndexChanged", function (event, isFullScreen) {

        });

        $(document).bind("uv.onCurrentViewUri", function (event, obj) {

        });

        $(document).bind("uv.onLoad", function (event, obj) {

            closeEditor();

            config = obj.bootstrapper.config;
            var locales = config.localisation.locales;

            $('#locale').empty();

            for (var i = 0; i < locales.length; i++){
                var l = locales[i];
                $('#locale').append('<option value="' + l.name + '">' + l.label + '</option>');
            }

            setSelectedLocale(obj.bootstrapper.params.locale);

            $('footer').show();
        });

        $(document).bind("uv.onCreated", function (event, obj) {
            setTestIds();
        });

        setJSONPEnabled();

        if ($('#manifestSelect option').length || $('#manifestSelect optgroup').length){
            setSelectedManifest();
        }

        createEditor();
        setInitialLocale();
        setDefaultToFullScreen();
        loadViewer();
    }

    var isLocalhost = document.location.href.indexOf('localhost') != -1;

    // if the embed script has been included in the page for testing, don't append it.
    var scriptIncluded = $('#embedUV').length;

    var manifestsUri, schema;

    loadConfigSchema(function() {
        loadManifests(function() {
            init();
        });
    });
});