// utilities
window.ab_tracking = {
    tool:'visualwebsiteoptimizer',
    version:'2.02',
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
        function formatCampaigns(campaigns) {
            return Object.entries(campaigns)
                .map(([key, value]) => `${key}:${value.c}`)
                .join('|');
        };
        var vwo_tests = window._vwo_campaignData;
        var vwo_tests_string = formatCampaigns(vwo_tests);
        return vwo_tests_string;
    },
    buildPushData: function(data) {
        var ab_tracking = window.ab_tracking;
        var test_type = data[0];
        var push_event_data = {};
        if (test_type == 'vS') {
            var experiment_id = data[1];
            var experiment_name_raw = _vwo_exp[experiment_id].name;
            var experiment_name = experiment_name_raw.split(' | ')[1]; // to set to 1 eventually
            var experiment_variation_id = data[2];
            var experiment_variation_name = _vwo_exp[experiment_id].comb_n[experiment_variation_id];
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
    }
};

// event listener for view_experiment
window.VWO.push(['onVariationApplied', function (data) {
    var ab_tracking = window.ab_tracking;
    ab_tracking.debugLog(data);
    var vwo_tests_string = ab_tracking.createHistory(); 
    ab_tracking.debugLog(vwo_tests_string);
    function onSuccess() {
        var ab_tracking = window.ab_tracking;
        ab_tracking.debugLog('view_experiment success')
        var event_data = ab_tracking.buildPushData(data);
        ab_tracking.sendViewExperiment(event_data,vwo_tests_string);
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
}]);

// function track_event
function track_event(name, id, data) {
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
};
window.track_event = track_event;
