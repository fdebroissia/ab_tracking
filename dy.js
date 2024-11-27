function afterVariationSelected(tagId, tagName, experienceName, experience, variations, isNoAction) {
    if (!window.ab_tracking) {
        window.ab_tracking = {
            tool:'dynamicyield',
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
                var ab_tracking = window.ab_tracking;
                ab_tracking.debugLog('createHistory: start');
                return '';
            },
            buildPushData: function(tagId, tagName, experienceName, experience, variations, isNoAction) {
                var ab_tracking = window.ab_tracking;
                ab_tracking.debugLog('buildPushData: start');
                var tests_array = [];
                for (var key in DYO.otags) {
                    if (DYO.otags.hasOwnProperty(key)) {
                        var newObj = { id: parseInt(key) };
                        for (var attr in DYO.otags[key]) {
                            if (DYO.otags[key].hasOwnProperty(attr)) {
                                newObj[attr] = DYO.otags[key][attr];
                            }
                        }
                        tests_array.push(newObj);
                    }
                };
                var render_type = variations[0].renderType;
                if (render_type == 'multi') {
                    var experiment_type = 'multi-parent'
                } else if (render_type == 'html' && !!tests_array.find(function(e) {return e.touchPointIds.includes(tagId)})) {
                    var experiment_type = 'multi-child'
                } else {
                    var experiment_type = render_type;
                };
                var push_event_data = {};
                if (experiment_type == 'multi-child') {
                    var experiment_id = tagId.toString();
                    var experiment_parent = tests_array.find(function(e) {return e.touchPointIds.includes(tagId)}).id;
                    var experiment_name_raw = decodeURIComponent(DYO.getTagVariationProperties(tagId).variation.display.name);
                    var experiment_goal = experiment_name_raw.split(' | ')[0];    
                    var experiment_name = experiment_name_raw.split(' | ')[1];
                    var experiment_variation_id = DYO.getUserObjectsAndVariations().find(function(e) {return e.objectId == experiment_parent}).variationIds[0].toString();
                    var experiment_variation_name = DYO.getUserObjectsAndVariations().find(function(e) {return e.objectId == experiment_parent}).variations[0];
                } else {
                    var experiment_id = tagId.toString();
                    var experiment_name_raw = decodeURIComponent(experience.name);
                    var experiment_name = experiment_name_raw.split(' | ')[1];
                    var experiment_variation_id = variations[0].id.toString();
                    var experiment_variation_name = decodeURIComponent(variations[0].name);
                    var experiment_goal = experiment_name_raw.split(' | ')[0];
                };
                push_event_data.experiment_id = experiment_id;
                push_event_data.experiment_name_raw = experiment_name_raw;
                push_event_data.experiment_name = experiment_name;
                push_event_data.experiment_variation_id = experiment_variation_id;
                push_event_data.experiment_variation_name = experiment_variation_name;
                push_event_data.experiment_goal = experiment_goal;
                if (!!experiment_parent) {
                    push_event_data.experiment_parent = experiment_parent.toString();
                };
                push_event_data.experiment_type = experiment_type;
                ab_tracking.debugLog('buildPushData: complete');
                return push_event_data;
            },
            sendViewExperiment: function(pushData, historyData) {
                var ab_tracking = window.ab_tracking;
                if (pushData.experiment_type == "html" || pushData.experiment_type == "multi-child") {
                    ab_tracking.debugLog('sendViewExperiment: event fired');
                    var eventData = pushData;
                    eventData.event = 'view_experiment';
                    eventData.experiment_history = historyData;
                    window.dataLayer.push(eventData);    
                } else {
                    ab_tracking.debugLog('sendViewExperiment: not event fired');
                }
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
                var ab_tracking = window.ab_tracking;
                ab_tracking.debugLog('proceedWithEventData: start');
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
                    ab_tracking.debugLog('trackEvent: wrong or no event_data argument');
                };
                push_data.event = name?.toString();
                push_data.experiment_tracking = true;
                delete push_data['gtm.uniqueEventId'];
                dataLayer.push(push_data);
                dataLayer.push({
                    experiment_tracking: false
                });
                ab_tracking.debugLog('proceedWithEventData: complete');
            }
        };        
    };
    ab_tracking.debugLog(arguments);
    var abt_tests_string = ab_tracking.createHistory(); 
    function onSuccess(tagId, tagName, experienceName, experience, variations, isNoAction) {
        var ab_tracking = window.ab_tracking;
        ab_tracking.debugLog('waitForCondition: success');
        var debugArray = [];
        debugArray.push(variations);
        var event_data = ab_tracking.buildPushData(tagId, tagName, experienceName, experience, variations, isNoAction);
        ab_tracking.sendViewExperiment(event_data,abt_tests_string);
    };
    function onFailure() {
        var ab_tracking = window.ab_tracking;
        ab_tracking.debugLog('waitForCondition: could not find ' + ab_tracking.prerequisiteEvent);
    };
    ab_tracking.waitForCondition(
        () => ab_tracking.eventExistsByName(ab_tracking.prerequisiteEvent),
        20,
        100,
        () => onSuccess(tagId, tagName, experienceName, experience, variations, isNoAction),
        onFailure
    );
    if (!track_event) {
        function track_event(name, id, data) {
            var ab_tracking = window.ab_tracking;
            ab_tracking.debugLog('trackEvent:',arguments);
            function onFailure() {
                var ab_tracking = window.ab_tracking;
                ab_tracking.debugLog('trackEvent: wrong or no experiment_id');
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
    };
}