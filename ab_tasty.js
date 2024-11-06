// utilities
window.ab_tracking = {
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
        var abt_tests = [];
        var abt_results = ABTasty.getCampaignHistory();
        var sorted_tests = Object.keys(abt_results).sort(function(a, b) {
            return a - b
        });
        sorted_tests.forEach(function(key) {
            abt_tests.push(key + ":" + abt_results[key]);
        });
        var abt_tests_string = abt_tests.join('|');
        return abt_tests_string;
    },
    buildPushData: function(event) {
        var test_type = event.detail.type;
        var push_event_data = {};
        if (test_type == 'mpt' || test_type == 'mvt') {
            var parent_test_id = ABTasty.getTestsOnPage()[event.detail.campaignId].testDatas.parentID;
            var experiment_id = event.detail.campaignId;
            var experiment_name_raw = ABTasty.results[parent_test_id]?.name;
            var experiment_name = experiment_name_raw.split(' | ')[1] + ' - ' + ABTasty.results[experiment_id]?.name;
            var experiment_variation_id = event.detail.variationId;
            var experiment_variation_name = ABTasty.results[experiment_id]?.variationName;
            var experiment_goal = experiment_name_raw.split(' | ')[0];
        } else {
            var experiment_id = event.detail.campaignId;
            var experiment_name_raw = ABTasty.results[experiment_id]?.name;
            var experiment_name = experiment_name_raw.split(' | ')[1];
            var experiment_variation_id = event.detail.variationId;
            var experiment_variation_name = ABTasty.results[experiment_id]?.variationName;
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
        return !!dataLayer.find((e) => e.event === 'view_experiment' && e.experiment_id === id);
    },
    getEventDataById: function(id) {
    return dataLayer.find((e) => e.event === 'view_experiment' && e.experiment_id === id);
    },
    eventExistsByName: function(name) {
    return !!dataLayer.find((e) => e.event === name);
    },
    proceedWithEventData: function(name, event_data) {
        var push_data = JSON.parse(JSON.stringify(event_data));
        if (typeof event_data === 'object' && event_data !== null) {
            for (var prop in event_data) {
                if (Object.prototype.hasOwnProperty.call(event_data, prop)) {
                    push_data[prop] = event_data[prop];
                }
            }
        } else {
            console.log('track_event used with a wrong or no event_data argument');
        }
        push_data.event = name?.toString();
        push_data.experiment_tracking = true;
        delete push_data['gtm.uniqueEventId'];
        dataLayer.push(push_data);
        dataLayer.push({
            experiment_tracking: false
        });
    }
};

// event listener for view_experiment
window.addEventListener('abtasty_executedCampaign', (event) => {
    var ab_tracking = window.ab_tracking;
    ab_tracking.debugLog(event);
    var abt_tests_string = ab_tracking.createHistory(); 
    function onSuccess() {
        var ab_tracking = window.ab_tracking;
        ab_tracking.debugLog('view_experiment success')
        var event_data = ab_tracking.buildPushData(event);
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
});

// function track_event
function track_event(name, id, data) {
    var ab_tracking = window.ab_tracking;
    ab_tracking.debugLog(arguments);
    function onFailure() {
        console.log('track_event used with wrong or no experiment_id');
        ab_tracking.proceedWithEventData(name,{});
    }
    ab_tracking.waitForCondition(
        () => ab_tracking.eventExists(id),
        20,
        100,
        () => ab_tracking.proceedWithEventData(name,ab_tracking.getEventDataById(id)),
        onFailure
    );
};
window.track_event = track_event;
