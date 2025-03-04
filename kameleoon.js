// utilities
if (!window.ab_tracking) {
    window.ab_tracking = {
        tool:'kameleoon',
        version:'3.1',
        prerequisiteEvent:'gtm.js',
        enableDebug: function() {
            localStorage.setItem('ab_debug', true)
        },
        disableDebug: function() {
            localStorage.removeItem('ab_debug')
        },
        debugLog: function(a) {
            if (!!localStorage.getItem('ab_debug')) {
                console.log(a)
            };
        },
        createHistory: function() {
            // it appears the function is not working with Kameleoon, replaced below
            var abt_tests = [];
            var KameleoonCampaignHistory = {};
            window.Kameleoon.API.Experiments.getActive().forEach(function(e) {KameleoonCampaignHistory[e.id] = e.associatedVariation.id});
            var sorted_tests = Object.keys(KameleoonCampaignHistory).sort(function(a, b) {return a - b});
            sorted_tests.forEach(function(key) {
                abt_tests.push(key + ":" + KameleoonCampaignHistory[key]);
            });
            var abt_tests_string = abt_tests.join('|');
        },
        buildPushData: function(experimentID, experimentName, variationID, variationName) {
            var test_type = 'ab';
            var push_event_data = {};
            if (test_type == 'ab') {
                // var parent_test_id = ;
                var experiment_id = experimentID;
                var experiment_name_raw = experimentName;
                var experiment_name = experiment_name_raw.split(' | ')[1];
                var experiment_variation_id = variationID;
                var experiment_variation_name = variationName;
                var experiment_goal = experiment_name_raw.split(' | ')[0];
            };
            push_event_data.experiment_id = experiment_id;
            push_event_data.experiment_name_raw = experiment_name_raw;
            push_event_data.experiment_name = experiment_name;
            push_event_data.experiment_variation_id = experiment_variation_id;
            push_event_data.experiment_variation_name = experiment_variation_name;
            push_event_data.experiment_goal = experiment_goal;
            return push_event_data;
        },
        sendViewExperiment: function(pushData, historyData) {
            var eventData = pushData;
            eventData.event = 'view_experiment';
            eventData.experiment_history = historyData;
            window.dataLayer.push(eventData);
        },
        waitForCondition: function(condition, maxAttempts, interval, onSuccess, onFailure) {
            let attempts = 0;
            let successCalled = false; 
            function attemptCheck() {
                if (condition()) {
                    successCalled = true;
                    onSuccess();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(attemptCheck, interval);
                } else if (!successCalled) {
                    onFailure();
                }
            }
            attemptCheck();
        },
        eventExists: function(id) {
            return !!dataLayer.find((e) => e.event === 'view_experiment' && e.experiment_id == id.toString());
        },
        getEventDataById: function(id) {
            return dataLayer.find((e) => e.event === 'view_experiment' && e.experiment_id == id.toString());
        },
        eventExistsByName: function(name) {
            return !!dataLayer.find((e) => e.event === name);
        },
        proceedWithEventData: function(name, event_data, data) {
            var push_data = JSON.parse(JSON.stringify(event_data));
            if (typeof event_data === 'object' && event_data !== null) {
                for (var prop in event_data) {
                    if (Object.prototype.hasOwnProperty.call(event_data, prop)) {
                        push_data[prop] = event_data[prop];
                    }
                }
            } else {
                console.log('track_event used with a wrong or no event_data argument');
            };
            if (typeof data === 'object' && data !== null) {
                for (var prop in data) {
                    if (Object.prototype.hasOwnProperty.call(data, prop)) {
                        push_data[prop] = data[prop];
                    }
                }
            } else {
                console.log('track_event used with a wrong or no event_data argument');
            };
            push_data.event = name?.toString();
            push_data.experiment_tracking = true;
            delete push_data['gtm.uniqueEventId'];
            dataLayer.push(push_data);
            dataLayer.push({
                experiment_tracking: false
            });
        },
        track_event: function(name, id, data) {
            var ab_tracking = window.ab_tracking;
            ab_tracking.debugLog(arguments);
            function onFailure() {
                console.log('track_event used with wrong or no experiment_id');
                ab_tracking.proceedWithEventData(name,{});
            };
            ab_tracking.waitForCondition(
                () => ab_tracking.eventExists(id),
                20,
                100,
                () => ab_tracking.proceedWithEventData(name,ab_tracking.getEventDataById(id),data),
                onFailure
            );
        }
    };    
    window.track_event = ab_tracking.track_event;
} else {
    window.ab_tracking.debugLog('ab_tracking already set');
};

// event trigger for view_experiment
((experimentID, experimentName, variationID, variationName) => {
    var ab_tracking = window.ab_tracking;
    ab_tracking.debugLog(arguments);
    var abt_tests = [];
    var KameleoonCampaignHistory = {};
    window.Kameleoon.API.Experiments.getActive().forEach(function(e) {KameleoonCampaignHistory[e.id] = e.associatedVariation.id});
    var sorted_tests = Object.keys(KameleoonCampaignHistory).sort(function(a, b) {return a - b});
    sorted_tests.forEach(function(key) {
        abt_tests.push(key + ":" + KameleoonCampaignHistory[key]);
    });
    var abt_tests_string = abt_tests.join('|'); 
    // var abt_tests_string = ab_tracking.createHistory(); 
    function onSuccess() {
        var ab_tracking = window.ab_tracking;
        ab_tracking.debugLog('view_experiment success')
        var event_data = ab_tracking.buildPushData(experimentID, experimentName, variationID, variationName);
        ab_tracking.sendViewExperiment(event_data,abt_tests_string);
    };
    function onFailure() {
        var ab_tracking = window.ab_tracking;
        console.log('could not find ' + ab_tracking.prerequisiteEvent);
    };
    ab_tracking.waitForCondition(
        () => ab_tracking.eventExistsByName(ab_tracking.prerequisiteEvent),
        20,
        100,
        onSuccess,
        onFailure
    )
})(experimentID, experimentName, variationID, variationName);
