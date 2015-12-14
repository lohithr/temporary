'use strict';

angular.module('meddLabpanelApp')

//Lab Panel Login Control
.controller('LabpanelLoginCtrl',['$scope', '$rootScope', 'customHttp', '$location', '$cookies', function ($scope, $root, customHttp, $location, $cookies){
	$scope.error = [];
	$scope.labpanelLogin = function () {
		var loginParams = 'username='+$scope.username+'&password='+$scope.password;
		console.log(loginParams);
		customHttp.request(loginParams,'/api/labpanellogin','POST',function (data) {
			console.log(data);
			if(data.status){
				if (data.data) {
					localStorage.setItem('labpanelSession', data.data);
					$root.labpanelSession = data.data;
					$location.path('/labpanel');
					$cookies.labpanelLoggedIn = 1;
					$cookies.labpanelSession = data.data._id;
					$cookies.lab_id = data.data.lab_id;
				}
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
}])

.controller('LabpanelCtrl',['$scope', '$rootScope', 'customHttp', '$location', '$cookies', function ($scope, $root, customHttp, $location, $cookies){
	console.log('yooooooooooooooo');
	$scope.lab_id = $cookies.lab_id;
	console.log($scope.lab_id);
	loadTestgroups();
	$scope.csv_or_direct = 'csv';
	function loadTestgroups() {
		$scope.changePublish = false;
		customHttp.request('','/api/testgroups/getall','GET',function (data) {
			if(data.status){
				$scope.testgroups = data.data;
				loadLab();
				var testgroups = $scope.testgroups;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				$scope.testgroups = [];
			}
		})
	}
	
	function loadLab () {
		var lab_id = $scope.lab_id;
		var impParams = 'id='+lab_id;
		customHttp.request(impParams,'/api/labs/getbyid','GET',function (data) {
			if(data.status){
				$scope.lab = data.data[0];
				$scope.testgroups = $scope.lab.testgroups;
				console.log($scope.lab);
				// updateTextFiels();
				// docReady.run();
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

}])

.controller('LabpanelAppointmentsCtrl',['$scope', '$rootScope', 'customHttp', '$location', '$cookies', '$filter', function ($scope, $root, customHttp, $location, $cookies, $filter){
	$scope.lab_id = $cookies.lab_id;
	console.log('LabpanelAppointmentsCtrl');
	$scope.error = [];
	loadTransactions();
	function loadTransactions() {
		var transactionParams = 'id='+$scope.lab_id;
		console.log(transactionParams)
		customHttp.request(transactionParams, '/api/transactions/getbylab', 'GET', function (data) {
			if(data.status){
				var allTransactions = data.data;
				$scope.diagnosticsTransactions = [];

				for (var i = 0; i < allTransactions.length; i++) {
					if (allTransactions[i].version >= 4) {
						if (allTransactions[i].timestamp) {
							allTransactions[i].booking_time = {
								date : new Date(allTransactions[i].timestamp.booking).toLocaleDateString(),
								time : new Date(allTransactions[i].timestamp.booking).toLocaleTimeString()
							}
							allTransactions[i].date_time = $filter('date')(new Date(allTransactions[i].timestamp.booking), 'dd MMM yyyy  - h:mm a')
						};
						if (allTransactions[i].type == 'diagnostics') {
							$scope.diagnosticsTransactions.push(allTransactions[i]);
						};
					};
				};
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
}])

.controller('LabpanelFillReportCtrl',['$scope', '$rootScope', 'customHttp', '$stateParams', '$cookies', function ($scope, $root, customHttp, $stateParams, $cookies){
	$scope.lab_id = $cookies.lab_id;
	console.log('LabpanelFillReportCtrl');
	$scope.error = [];
	$scope.transaction_id = $stateParams.transaction_id;
	
	$scope.alreadyFilled = [];

	loadTests();
	function loadTests () {
		customHttp.request('','/api/tests/getall','GET',function (data) {
			console.log(data);
			if(data.status){
				$scope.allTests = data.data;
				console.log($scope.allTests);
				$scope.testsFetched = true;
				loadTransaction();
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
	// loadTransaction();
	function loadTransaction() {
		var transactionParams = 'id='+$scope.transaction_id;
		console.log(transactionParams)
		customHttp.request(transactionParams,'/api/transactions/getbyid','GET',function (data) {
			console.log(data);
			if(data.status){
				$scope.transaction = data.data[0];
				$scope.patient = $scope.transaction.patient;
				console.log($scope.patient);
				if ($scope.transaction.patient) {
					if ($scope.transaction.patient._id) {
						var patientParams = 'id='+$scope.transaction.patient._id;
						customHttp.request(patientParams, '/api/patients/get', 'GET', function (data0) {
							console.log(data0);
							if (data0.status) {
								$scope.patient = data0.data[0];
								console.log($scope.patient);

								console.log($scope.patient.ehr.pathology);
								console.log($scope.patient.ehr.pathology.length);
								console.log($scope.patient.ehr.pathology[0]);
								$scope.fintestgroups=[];
								var t=[];
								var t1 = {
									_id : "",
									name : "",
									tests : t
								}
								var t2=false;
								for (var i = 0; i < $scope.patient.ehr.pathology.length; i++) {
									console.log($scope.patient.ehr.pathology[i]);
									if ($scope.patient.ehr.pathology[i].transaction_id == $scope.transaction._id) {
										t2=true;
										$scope.lohith=$scope.patient.ehr.pathology[i];
										for(var lol=0;lol<$scope.patient.ehr.pathology[i].testgroups.length;lol++){										  if($scope.patient.ehr.pathology[i].testgroups[lol].name){
										  	$scope.alreadyFilled.push(true);
										  }
										  else{$scope.alreadyFilled.push(false);};
									    

										  if(!$scope.alreadyFilled[lol]){$scope.fintestgroups.push(t1);}
										  else{
										  	$scope.fintestgroups.push($scope.patient.ehr.pathology[i].testgroups[lol]);
										  };
										  
									    };
										$scope.current_ehr = $scope.patient.ehr.pathology[i];
										$scope.patient.ehr.pathology.splice(i,1);
										$scope.fintestgroups = $scope.current_ehr.testgroups;
										console.log($scope.current_ehr);
										console.log($scope.patient.ehr.pathology);
										break;
									};
								};

								if (!$scope.patient.gender) {
									$scope.category = 'male';
								} else {
									$scope.category = $scope.patient.gender.toLowerCase();
								}
								
								$scope.testgroup1 = $scope.transaction.diagnostics.tests;
								$scope.testgroup=[];
								$scope.tests=[];
								$scope.matchedTests1 = {};
								$scope.nametonum={};
								// $scope.temp={};

								for(var lol=0;lol<$scope.testgroup1.length;lol++)
								{
									if(!t2){  	
										$scope.alreadyFilled.push(false);
										$scope.fintestgroups.push(t1);
								     };
									var testgroupParams = 'id='+$scope.testgroup1[lol]._id;
									// $scope.testing=lol;
									console.log(testgroupParams);
									customHttp.request(testgroupParams, '/api/testgroups/getbyid', 'GET', function (data2) {
										if (data2.status) {
											$scope.matchedTests = [];
											console.log(data2.data[0]);
											$scope.testgroup.push(data2.data[0]);
											// $scope.tests = $scope.testgroup.tests;
											var length=$scope.testgroup.length;
											for (var i = 0; i < $scope.testgroup[length-1].tests.length; i++) {
												for (var j = 0; j < $scope.allTests.length; j++) {
													if ($scope.testgroup[length-1].tests[i]._id == $scope.allTests[j]._id) {
														$scope.matchedTests.push($scope.allTests[j]);
														break;
													};
												};
											};
											// console.log($scope.matchedTests);
											// console.log($scope.alreadyFilled);
											// $scope.temp["hai"]=$scope.testgroup[length-1];
											$scope.matchedTests1[$scope.testgroup[length-1]["name"]]=$scope.matchedTests;
											$scope.nametonum[$scope.testgroup[length-1]["name"]]=length-1;
											if ($scope.alreadyFilled[length-1]) {
												var a=0;
												for(var k=0;k<$scope.current_ehr.testgroups.length;k++){
													if($scope.current_ehr.testgroups[k]["name"] == $scope.testgroup[length-1]["name"]){
														a=k;break;
													};
												};
												console.log($scope.current_ehr.testgroups[a].tests);
												console.log('Already Filled');
												$scope.tests.push($scope.current_ehr.testgroups[a].tests);

											} else {
												console.log('Not Already Filled');
												// $scope.tests = $scope.matchedTests;
											    $scope.tests.push($scope.matchedTests);
												changeCategory(length-1);

											}
										};
									})
								};
							};
							$scope.lohith=$scope.fintestgroups;
						})
					};
				};
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	var changeCategory = function (a) {
		var matchedT = $scope.matchedTests1[$scope.testgroup[a]["name"]];
		// console.log(matchedTests);
		// console.log($scope.category);
		// console.log($scope.category == 'female');
		for (var i = 0; i < $scope.tests[a].length; i++) {
			if (matchedT[i].range) {
                $scope.tests[a][i]["value"]=0;
				if ($scope.category == 'male') {
					$scope.tests[a][i].range = matchedT[i].range.male;
				} else if ($scope.category == 'female') {
					// console.log(matchedTests[i].range);
					$scope.tests[a][i].range = matchedT[i].range.female;
					// console.log(matchedTests[i].range);
				} else if ($scope.category == 'children') {
					$scope.tests[a][i].range = matchedT[i].range.children;
				}
			};
		};
		console.log($scope.tests);
	}

	$scope.changeCategory = function (a) {
		changeCategory(a);
	}


	$scope.uploadResult = function (testgroupname) {
		// console.log($scope.tests);
		var a=0;var bool=false;
		for(var k=0;k<$scope.testgroup.length;k++){
			if($scope.testgroup[k]["name"] == testgroupname){
				a=k;bool=true;break;
			};
		};
		if(bool){
			$scope.finaltests=[];
			for(var k=0;k<$scope.tests[a].length;k++)
			{
	          var temp={};
	          temp["_id"]=$scope.tests[a][k]["_id"];
	          temp["name"]=$scope.tests[a][k]["name"];
	          temp["range"]=$scope.tests[a][k]["range"];
	          temp["value"]=$scope.tests[a][k]["value"];
	          $scope.finaltests.push(temp);
			};
			// Materialize.toast('success', 2000);
			
			var testgroup = {
				_id : $scope.testgroup[a]._id,
				name : $scope.testgroup[a].name,
				tests : $scope.finaltests
			}
			$scope.fintestgroups[a]=testgroup;
		};
		var eHR_Diagnostics = {
			coupon : $scope.transaction.coupon,
			transaction_id : $scope.transaction._id,
			testgroups : $scope.fintestgroups,
			timestamp : {
				booking : $scope.transaction.timestamp.booking,
				report : new Date
			}
		}
		bool=true;
		for(var lol=0;lol < $scope.patient.ehr.pathology.length;lol++)
		{
			if($scope.patient.ehr.pathology[lol].transaction_id==eHR_Diagnostics){
				$scope.patient.ehr.pathology[lol]=eHR_Diagnostics;
				bool=false;
			};
		}
		if(bool){$scope.patient.ehr.pathology.push(eHR_Diagnostics);}
		console.log($scope.patient);



		var impParams = 'patient='+JSON.stringify($scope.patient);
		$scope.lohith1= $scope.patient.ehr.pathology;
		console.log(impParams);
		customHttp.request(impParams,'/api/patients/update','POST',function (data) {
			console.log(data);
			if(data.status){
				$scope.transaction.timestamp.redeeming = eHR_Diagnostics.timestamp.report;
				var txn = {
					_id : $scope.transaction._id,
					timestamp : $scope.transaction.timestamp,
					redeemed : true
				}
				var txnParams = 'transaction='+JSON.stringify(txn);
				customHttp.request(txnParams,'/api/transactions/update','POST',function (data1) {
					console.log(data1);
					if(data1.status){
						if ($scope.alreadyFilled[a]) {
							Materialize.toast('Successfully updated test report!', 2000);
						} else {
							Materialize.toast('Successfully uploaded test report!', 2000);
						}
					}
					else{
						$scope.error.push({
							type : 'fail',
							message: data.message
						})
						Materialize.toast('Successfully uploaded test report!', 2000);
						Materialize.toast('But Could not update transactions!', 2000);
					}
				})
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! Some error occured', 2000);
			}
		})
	}
}])