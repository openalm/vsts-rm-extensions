
function downloadContent(data, name) {
    var file = new Blob([data], {type: 'application/json'});
    if(window.navigator && window.navigator.msSaveBlob){
        window.navigator.msSaveBlob(file, name);
    }
    else{
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
    }
}

var exportDefinitionContextMenu = (function () {
    "use strict";

    return {
        execute: function (sourceItemContext) {
            // Load VSTS controls and REST client
            VSS.require(["VSS/Controls", "VSS/Service", "ReleaseManagement/Core/RestClient"],
            function (Controls, VSS_Service, RM_WebApi) {
            var vsoContext = VSS.getWebContext();
            // Get a RM client to make REST calls
            var rmClient = VSS_Service.getCollectionClient(RM_WebApi.ReleaseHttpClient);
            rmClient.getReleaseDefinition(vsoContext.project.id,sourceItemContext.definition.id).then(function(def){
                downloadContent(JSON.stringify(def), def.name + ".json");
            }); 
        });
      }
    }
}());

var cloneDefinitionContextMenu = (function () {
    "use strict";

    return {
        execute: function (sourceItemContext) {
            // Load VSTS controls and REST client
            VSS.require(["VSS/Controls", "VSS/Service", "ReleaseManagement/Core/RestClient"],
            function (Controls, VSS_Service, RM_WebApi) {
                var newDefinitionName = prompt("New definition name:", sourceItemContext.definition.name + " - Copy");
                if (newDefinitionName != null)
                {
                    sourceItemContext.view.logMessage("Creating " + newDefinitionName + "...");
                    var vsoContext = VSS.getWebContext();
                    // Get a RM client to make REST calls
                    var rmClient = VSS_Service.getCollectionClient(RM_WebApi.ReleaseHttpClient);
                    rmClient.getReleaseDefinition(vsoContext.project.id,sourceItemContext.definition.id).then(function(definition){
                        definition.name = newDefinitionName;
						rmClient.createReleaseDefinition(definition, vsoContext.project.id).then( function() {
                            sourceItemContext.view.refresh();
                            sourceItemContext.view.logMessage("Cloned \'"+ sourceItemContext.definition.name +"\' and created \'" + newDefinitionName + "\'");
                        }, function(error){
                            sourceItemContext.view.logError(error);
                        });
                    }, function(error){
                        sourceItemContext.view.logError(error);
                    });
                }
            });
        }
    }
}());

var importDefinitionToolbarMenu = (function () {
    "use strict";

    return {
        execute: function (sourceItemContext) {
            
            var element = document.createElement('div');
            element.innerHTML = '<input type="file" accept=".json,.txt">';
            var fileInput = element.firstChild;

            fileInput.addEventListener('change', function() {
                sourceItemContext.view.logMessage("Importing release definition...");
                var file = fileInput.files[0];

                var definitionReader = new FileReader();

                definitionReader.onload = function() {
                    var definition = null;
                    try{
                        var definition = JSON.parse(definitionReader.result);
						var artifact = definition.linkedArtifacts;
                    } catch(error)
                    {
                        sourceItemContext.view.logError(error);
                    }
                    
                    if(definition){
						if(definition.environments) {
							definition.environments.forEach(function(environment) {
								environment.queueId = 0;
							});
						}
                        VSS.require(["VSS/Service", "ReleaseManagement/Core/RestClient"], function (VSS_Service, RM_WebApi) {
                            var vsoContext = VSS.getWebContext();
                            var rmClient = VSS_Service.getCollectionClient(RM_WebApi.ReleaseHttpClient);
                            rmClient.createReleaseDefinition(definition, vsoContext.project.id).then( function() {								
                                sourceItemContext.view.refresh();
                                sourceItemContext.view.logMessage("Release definition imported successfully");
                            }, 
                            function(error){
                                sourceItemContext.view.logError(error);
                            });
                        });
                    }
                };
                definitionReader.readAsText(file);    
            }, false);
            fileInput.click();
        }
    }
}());

VSS.register("exportDefinitionContextMenu", exportDefinitionContextMenu);
VSS.register("cloneDefinitionContextMenu", cloneDefinitionContextMenu);
VSS.register("importDefinitionToolbarMenu", importDefinitionToolbarMenu);