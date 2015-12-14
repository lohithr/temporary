'use strict';

angular.module('meddAdminApp')
.controller('AdminCtrl', function ($scope){	
	$scope.tagline = 'Happy to help you!';
})
.controller('AdminLoginCtrl',['$scope', '$rootScope', 'customHttp', '$location', '$cookies', function ($scope, $root, customHttp, $location, $cookies){
	$scope.error = [];
	$scope.adminLogin = function () {
		var loginParams = 'username='+$scope.username+'&password='+$scope.password;
		customHttp.request(loginParams,'/adminlogin','POST',function (data) {
			if(data.status){
				if (data.data) {
					localStorage.setItem('adminSession', data.data);
					$root.adminSession = data.data;
					$location.path('/adminmedd');
					$cookies.adminLoggedIn = 1;
					$cookies.adminSession = data.data;
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
.controller('AdminLabCtrl',['$scope', 'customHttp', 'fileUpload', 'docReady', '$cookies', function ($scope, customHttp, fileUpload, docReady, $cookies){
	$scope.loading = true;
	loadCities();
	function loadCities() {
		customHttp.request('','/api/cities/get','GET',function (data) {
			if(data.status){
				$scope.cities = data.data;
			} else{
				console.log('Some Error occurred while fetching cities');
			}
		})
	}
	$scope.error = [];
	$scope.labs = [];
	$scope.lab = {
		name : '',
		email : '',
		phone : '',
		address : '',
		rating : '',
		facilities : {
			home_collection : false,
			credit_card : false,
			insurance : false,
			ac : true,
			parking : true,
			nabl : false
		},
		geolocation : {
			latitude : 22.7,
			longitude : 75.9
		},
		timing : {
			days : {
				sun : true,
				mon : true,
				tue : true,
				wed : true,
				thu : true,
				fri : true,
				sat : true
			},
			time : {
				from 	: '10 AM',
				to 		: '8 PM'
			}
		},
		cover : ''
	}
	loadLabs();
	function loadLabs() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/labs/get','GET',function (data) {
			if(data.status){
				$scope.labs = data.data;
				$scope.loading = false;
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
	
	$scope.addLab = function () {
		var nd = new Date();
		$scope.lab.created_on = nd;

		if ($scope.lab.home_collection) {
			$scope.lab.facilities.home_collection = true;
		};
		$scope.lab.home_collection_only = ($scope.lab.home_collection && !$scope.lab.lab_visit);
		console.log($scope.lab);
		
		var labParams = 'lab='+JSON.stringify($scope.lab);
		console.log(labParams);

		customHttp.request(labParams,'/api/labs/create','POST',function (data) {
			console.log(data.status);
			if(data.status){
				var lab_id = data.lab;
				console.log(lab_id);
				var coverParams = $scope.cover;
				fileUpload.upload(coverParams,'/api/labs/updatecover', lab_id, '' ,function (data2) {
					if(data2.status){
						console.log('File upload succeeded!')
						console.log(data2);
						document.getElementById('newlab').reset();
						Materialize.toast('Successfully added lab!', 2000);
					}
					else{
						console.log('File upload failed!')
						$scope.error.push({
							type : 'fail',
							message: data2.message
						})
						console.log($scope.error[0]);
						Materialize.toast('Lab Added! Cover picture not uploaded!', 2000);
					}
				})
				console.log(data);
				$scope.labs.push(data.data);
				loadLabs();
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.replicate_price = function () {
		console.log($scope.lab1);
		console.log($scope.lab2);

		$scope.lab2.testgroups = $scope.lab1.testgroups;
		var impParams = 'lab='+JSON.stringify($scope.lab2);
		console.log(impParams);
		customHttp.request(impParams,'/api/labs/update','POST',function (data) {
			if(data.status){
				Materialize.toast('Successfully replicated!', 2000);
				$scope.lab1 = $scope.lab2 = '';
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
				Materialize.toast('There occurred some error!', 2000)
			}
		})
	}

	$scope.deleteLab = function (lab_id) {
		$scope.labToBeDeleted = lab_id;
		$('#deleteLabModal').openModal();
	}

	$scope.deleteYes = function (lab_id) {
		var impParams = 'id='+lab_id;
		$('#deleteLabModal').closeModal();
		customHttp.request(impParams,'/api/labs/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('Successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.labs.forEach(function(lab){
					if( lab._id == lab_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.labs.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		$scope.labToBeDeleted = '';
		$('#deleteLabModal').closeModal();
	}

	$scope.changePublish =  function (lab) {
		delete lab.testgroups;
		console.log(lab.publish);
		var impParams = 'lab='+JSON.stringify(lab);
		console.log(impParams);
		customHttp.request(impParams,'/api/labs/update','POST',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('Lab publish change made!', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0].message);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}

	$scope.downloadCsv = function (lab_id) {
		console.log(lab_id);
		var impParams = 'lab_id='+lab_id;
		customHttp.request(impParams,'/api/labs/downloadcsv','GET',function (data) {
			if(data.status){
				// $scope.testgroups = data.data;
				// loadLab();
				// var testgroups = $scope.testgroups;
				console.log('yo');
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error);
			}
		})
	}
}])
.controller('AdminLabEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', 'fileUpload', 'docReady', function ($scope, $location, customHttp, $stateParams, fileUpload, docReady){
	$scope.error = [];
	loadTestgroups();
	$scope.csv_or_direct = 'csv';
	$scope.predicate = 'name';
	loadCities();
	function loadCities() {
		customHttp.request('','/api/cities/get','GET',function (data) {
			if(data.status){
				$scope.cities = data.data;
			} else{
				console.log('Some Error occurred while fetching cities');
			}
		})
	}
	function loadTestgroups() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/testgroups/get','GET',function (data) {
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
		var lab_id = $stateParams.id;
		var impParams = 'id='+lab_id;
		customHttp.request(impParams,'/api/labs/getbyid','GET',function (data) {
			if(data.status){
				$scope.lab = data.data[0];
				$scope.testgroups = $scope.lab.testgroups;
				console.log($scope.lab);
				// updateTextFiels();
				docReady.run();
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.medd_per = 25;
	$scope.user_per = 20;

	$scope.change_price = function (testgroup) {
		testgroup.medd = (1-$scope.medd_per/100)*testgroup.mrp;
		testgroup.user = (1-$scope.user_per/100)*testgroup.mrp;
	}

	$scope.$watch('cover', function() {
		if ($scope.cover) {
			$scope.lab.cover.image = $scope.cover.name;
		};
	});

	$scope.updateLab = function (type) {
		if (type=='basic') {
			console.log('type = basic');
			delete $scope.lab.admin;
			delete $scope.lab.testgroups;

			if ($scope.lab.home_collection) {
				$scope.lab.facilities.home_collection = true;
			};
			$scope.lab.home_collection_only = ($scope.lab.home_collection && !$scope.lab.lab_visit);
			console.log($scope.lab);
			var impParams = 'lab='+JSON.stringify($scope.lab);
			console.log(impParams);
			customHttp.request(impParams,'/api/labs/update','POST',function (data) {
				if(data.status){
					console.log(data);
					// $location.path("/adminmedd/labs");
					Materialize.toast('Lab updated successfully', 2000);
				}
				else{

					$scope.error.push({
						type : 'fail',
						message: data.message
					})
					console.log($scope.error.length);
					console.log($scope.error[0]);
					Materialize.toast('Sorry! There occurred some error', 2000);
				}
			})

	        if ($scope.cover!=undefined) {
				fileUpload.upload($scope.cover,'/api/labs/updatecover', $scope.lab._id, '' ,function (data) {
					if(data.status){
						console.log('File upload succeeded!')
						console.log(data);
						// $location.path("/adminmedd/labs");
						Materialize.toast('Lab picture updated successfully', 2000);
					}
					else{
						console.log('File upload failed!')
						$scope.error.push({
							type : 'fail',
							message: data.message
						})
						console.log($scope.error.length);
						console.log($scope.error[0]);
						Materialize.toast('Sorry! There occurred some error', 2000);
					}
				})
	        };
		} else if (type=='admin') {
			console.log('type = admin')
			if ($scope.lab.admin!=undefined) {
				console.log($scope.lab.admin);
				var lab_params = {
					_id : $scope.lab._id,
					admin: {
						username : $scope.lab.admin.username,
						password : $scope.lab.admin.password
					}
				}
				var impParams = 'lab='+JSON.stringify(lab_params);
				console.log(impParams);
				customHttp.request(impParams,'/api/labs/update','POST',function (data) {
					if(data.status){
						console.log(data);
						// $location.path("/adminmedd/labs");
						Materialize.toast('Lab updated successfully', 2000);
					}
					else{

						$scope.error.push({
							type : 'fail',
							message: data.message
						})
						console.log($scope.error.length);
						console.log($scope.error[0]);
						Materialize.toast('Sorry! There occurred some error', 2000);
					}
				})
			} else {
				Materialize.toast('Please fill out the fields', 2000);
			}
		} else if (type=='csv') {
			console.log('type = csv')
			if ($scope.lab_csv!=undefined) {
				console.log($scope.lab_csv);
				fileUpload.upload($scope.lab_csv,'/api/labs/uploadcsv', $scope.lab._id, '' ,function (data) {
					if(data.status){
						console.log('File upload succeeded!')
						console.log(data);
						Materialize.toast('CSV uploaded successfully', 2000);
					}
					else{
						console.log('File upload failed!')
						$scope.error.push({
							type : 'fail',
							message: data.message
						})
						console.log($scope.error.length);
						console.log($scope.error[0]);
						Materialize.toast('Sorry! There occurred some error', 2000);
					}
				})
			} else {
				Materialize.toast('Please choose a csv file to upload', 2000);
			}
		} else if (type=='ratelist') {
			console.log('type = ratelist')
			var testgroup = '';
			var lab_testgroup = {};
			var lab_testgroups = [];
			for (var i = 0; i < $scope.testgroups.length; i++) {
				testgroup = $scope.testgroups[i];
				if (testgroup.available) {
					lab_testgroup = {
						_id : testgroup._id,
						name : testgroup.name,
						mrp	: testgroup.mrp,
						medd	: testgroup.medd,
						user	: testgroup.user
					}
					lab_testgroups.push(lab_testgroup);
				};
			};
			var labParams = {
				_id : $scope.lab._id,
				testgroups : lab_testgroups
			}
			// $scope.lab.testgroups = lab_testgroups;
			console.log(labParams);
			var impParams = 'lab='+JSON.stringify(labParams);
			console.log(impParams);
			customHttp.request(impParams,'/api/labs/update','POST',function (data) {
				console.log(data);
				if(data.status){
					console.log(data);
					$location.path("/adminmedd/labs");
					Materialize.toast('Ratelist updated successfully', 2000);
				}
				else{
					$scope.error.push({
						type : 'fail',
						message: data.message
					})
					console.log($scope.error.length);
					console.log($scope.error[0]);
					Materialize.toast('Sorry! There occurred some error', 2000);
				}
			})
		}
	}

	$scope.discardChanges = function () {
		$location.path("/adminmedd/labs");
	}

}])

// Admin Panel Tests Controller
.controller('AdminTestCtrl',['$scope', 'customHttp', 'docReady', function ($scope, customHttp, docReady){
	console.log('Test controller');
	$scope.error = [];
	$scope.loading = true;
	$scope.tests = [];
	$scope.predicate = 'name';
	$scope.test = {}
	$scope.test.common_range = true;
	loadTests();
	function loadTests() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/tests/get','GET',function (data) {
			if(data.status){
				$scope.tests = data.data;
				console.log($scope.tests);
				$scope.loading = false;
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
	$scope.addTest = function () {
		loadTests();
		var nd = new Date();
		if ($scope.test.common_range) {
			$scope.test.range.male = $scope.test.range.common;
			$scope.test.range.female = $scope.test.range.common;
			$scope.test.range.children = $scope.test.range.common;
		}
		delete $scope.test.range.common;

		var impParams = 'test='+JSON.stringify($scope.test);
		console.log(impParams);
		customHttp.request(impParams,'/api/tests/create','POST',function (data) {
			console.log(data.status);
			if(data.status){
				document.getElementById('newtest').reset();
				$scope.test = {}
				$scope.test.common_range = true;
				console.log(data);
				$scope.tests.push(data.data);
				loadTests();
				Materialize.toast('Test added successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.changePublish =  function (test) {
		console.log(test.publish);
		// $scope.changePublish = true;

	}

	$scope.deleteTest = function (test_id) {
		console.log('confirm deletion of ' + test_id);
		$scope.testToBeDeleted = test_id;
		$('#deleteTestModal').openModal();
		console.log($scope.testToBeDeleted);
	}

	$scope.deleteYes = function (test_id) {
		console.log('yoooooooooo');
		$scope.testToBeDeleted = '';
		$('#deleteTestModal').closeModal();
		console.log('final deletion of ' + test_id);
		var impParams = 'id='+test_id;
		customHttp.request(impParams,'/api/tests/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('Test successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.tests.forEach(function(test){
					if( test._id == test_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.tests.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		console.log('cancel deletion of ' + $scope.testToBeDeleted);
		$scope.testToBeDeleted = '';
		$('#deleteTestModal').closeModal();
	}

	$scope.updateTest = function (test) {
		var impParams = 'test='+JSON.stringify(test);
		customHttp.request(impParams,'/api/tests/update','POST',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('Test updated successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}
}])
.controller('AdminTestEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', function ($scope, $location, customHttp, $stateParams){
	$scope.error = [];
	testEdit();
	function testEdit () {
		var test_id = $stateParams.id;
		var impParams = 'id='+test_id;
		customHttp.request(impParams,'/api/tests/getbyid','GET',function (data) {
			if(data.status){
				$scope.test = data.data[0];
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.updateTest = function (test) {
		var impParams = 'test='+JSON.stringify(test);
		console.log(impParams);
		customHttp.request(impParams,'/api/tests/update','POST',function (data) {
			console.log(data.status);
			if(data.status){
				console.log(data);
				$location.path("/adminmedd/tests");
				Materialize.toast('Test updated successfully', 2000);
			}
			else{

				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}

	$scope.discardChanges = function () {
		Materialize.toast('No changes made', 2000);
		$location.path("/adminmedd/tests");
	}

}])

// Admin Panel Testgroups Controller
.controller('AdminTestgroupCtrl',['$scope', 'customHttp', 'docReady', 'fileUpload', function ($scope, customHttp, docReady, fileUpload){
	$scope.error = [];
	$scope.loading = true;
	$scope.testgroups = [];
	$scope.testgroup = {
		name : '',
		type : 'pathology',
		frequency : 100,
		aliases : []
	}
	$scope.predicate = 'name';
	$scope.pushTests = [{}];
	$scope.pushAliases = [{}];
	$scope.$watch('testgroup.name', function () {
		$scope.testgroup.url_name = $scope.testgroup.name.trim().toLowerCase().replace(/([.,*-+?^=!:${}()|\[\]\/\\])/g, "").replace(/  /g, ' ').split(' ').join('-');
	})

	loadTestgroups();
	function loadTestgroups() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/testgroups/get','GET',function (data) {
			if(data.status){
				$scope.testgroups = data.data;
				console.log($scope.testgroups);
				$scope.loading = false;
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

	loadTests();
	function loadTests() {
		customHttp.request('','/api/tests/get','GET',function (data) {
			if(data.status){
				$scope.tests = data.data;
				console.log($scope.tests);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
	$scope.insertAlias = function () {
		$scope.pushAliases.push({name : ''});
		console.log($scope.pushTests);
	};

	$scope.removeAlias = function (index, pushAlias) {
		$scope.pushAliases.splice(index,1);
		console.log($scope.pushAliases);
	}

	$scope.insertTest = function () {
		$scope.pushTests.push({
		});
		console.log($scope.pushTests);
	};

	$scope.removeTest = function (index, pushTest) {
		$scope.pushTests.splice(index,1);
		console.log($scope.pushTests);
	}

	$scope.addTestgroup = function () {
		var nd = new Date();
		$scope.testgroup.tests = [];


		console.log($scope.pushAliases)

		for (var i = 0; i < $scope.pushTests.length; i++) {
			if ($scope.pushTests[i].test) {
				var test = {
					_id : $scope.pushTests[i].test._id,
					name : $scope.pushTests[i].test.name
				}
				$scope.testgroup.tests.push(test);
			};
		};

		for (var j = 0; j < $scope.pushAliases.length; j++) {
			if ($scope.pushAliases[j].name) {
				$scope.testgroup.aliases.push($scope.pushAliases[j].name);
			};
		};
		
		var impParams = 'testgroup='+JSON.stringify($scope.testgroup);
		console.log(impParams);
		customHttp.request(impParams,'/api/testgroups/create','POST',function (data) {
			console.log(data.status);
			if(data.status){
				document.getElementById('newtestgroup').reset();
				console.log(data);
				$scope.testgroups.push(data.data);
				loadTestgroups();
				Materialize.toast('Testgroup added successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.changePublish =  function (testgroup) {
		console.log(testgroup.publish);
		// $scope.changePublish = true;

	}

	$scope.deleteTestgroup = function (testgroup_id) {
		console.log('confirm deletion of ' + testgroup_id);
		$scope.testgroupToBeDeleted = testgroup_id;
		$('#deleteTestgroupModal').openModal();
		console.log($scope.testgroupToBeDeleted);
	}

	$scope.deleteYes = function (testgroup_id) {
		console.log('yoooooooooo');
		$scope.testgroupToBeDeleted = '';
		$('#deleteTestgroupModal').closeModal();
		console.log('final deletion of ' + testgroup_id);
		var impParams = 'id='+testgroup_id;
		customHttp.request(impParams,'/api/testgroups/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('Testgroup successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.testgroups.forEach(function(testgroup){
					if( testgroup._id == testgroup_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.testgroups.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		console.log('cancel deletion of ' + $scope.testgroupToBeDeleted);
		$scope.testgroupToBeDeleted = '';
		$('#deleteTestgroupModal').closeModal();
	}

	$scope.updateTestgroup = function (testgroup) {
		var impParams = 'testgroup='+JSON.stringify(testgroup);
		customHttp.request(impParams,'/api/testgroups/update','POST',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('Testgroup updated successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}
	$scope.autoUpdateTestgroups = function () {
		Materialize.toast('Wait for 5 seconds! Testgroups being autoUpdated!', 2000);
		customHttp.request('','/api/testgroups/autoupdate','GET',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('Testgroups updated successfully', 2000);
			}
			else{
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}

	$scope.uploadCsv = function () {
		console.log('type = csv');
		console.log('$scope.testgroups_csv');
		console.log($scope.testgroups_csv);
		if ($scope.testgroups_csv!=undefined) {
			console.log($scope.testgroups_csv);
			fileUpload.upload($scope.testgroups_csv,'/api/testgroups/uploadcsv', '', '' ,function (data) {
				if(data.status){
					console.log('File upload succeeded!')
					console.log(data);
					$scope.testgroups_csv = '';
					Materialize.toast('CSV uploaded successfully', 2000);
				}
				else{
					console.log('File upload failed!')
					$scope.error.push({
						type : 'fail',
						message: data.message
					})
					console.log($scope.error.length);
					console.log($scope.error[0]);
					Materialize.toast('Sorry! There occurred some error', 2000);
				}
			})
		} else {
			Materialize.toast('Please choose a csv file to upload', 2000);
		}
	}
}])
.controller('AdminTestgroupEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', function ($scope, $location, customHttp, $stateParams){
	$scope.loading = true;
	$scope.error = [];
	loadTestgroup();
	var testgroup_name = '';
	function loadTestgroup () {
		var testgroup_id = $stateParams.id;
		var impParams = 'id='+testgroup_id;
		customHttp.request(impParams,'/api/testgroups/getbyid','GET',function (data) {
			console.log(data);
			if(data.status){
				$scope.testgroup = data.data[0];
				testgroup_name = $scope.testgroup.name;
				$scope.pushTests = $scope.testgroup.tests;
				$scope.pushAliases = [];
				if ($scope.testgroup.aliases) {
					for (var i = 0; i < $scope.testgroup.aliases.length; i++) {
						// $scope.testgroup.aliases[i]
						var alias = {
							name : $scope.testgroup.aliases[i]
						}
						$scope.pushAliases.push(alias);
					};
				};
				if (!$scope.testgroup.url_name) {
					$scope.testgroup.url_name = makeUrl($scope.testgroup.name);
				};
				$scope.loading = false;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	};

	$scope.$watch('testgroup.name', function () {
		if (!$scope.loading) {
			$scope.testgroup.url_name = makeUrl($scope.testgroup.name);
		};
	})

	loadTests();
	function loadTests() {
		customHttp.request('','/api/tests/get','GET',function (data) {
			if(data.status){
				$scope.tests = data.data;
				console.log($scope.tests);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	function makeUrl (name) {
		name = name.trim().toLowerCase().replace(/([.,*-+?^=!:${}()|\[\]\/\\])/g, "").replace(/  /g, ' ').split(' ').join('-');
		return name;
	}

	$scope.insertAlias = function () {
		$scope.pushAliases.push({name : ''});
		console.log($scope.pushTests);
	};
	$scope.removeAlias = function (index, pushAlias) {
		$scope.pushAliases.splice(index,1);
		console.log($scope.pushAliases);
	}

	$scope.insertTest = function () {
		$scope.pushTests.push({
		});
		console.log($scope.pushTests);
	};
	$scope.removeTest = function (index, pushTest) {
		$scope.pushTests.splice(index,1);
		console.log($scope.pushTests);
	};

	$scope.updateTestgroup = function () {
		$scope.testgroup.tests = [];
		$scope.testgroup.aliases = [];
		for (var i = 0; i < $scope.pushTests.length; i++) {
			if ($scope.pushTests[i].test) {
				var test = {
					_id : $scope.pushTests[i].test._id,
					name : $scope.pushTests[i].test.name
				}
				$scope.testgroup.tests.push(test);
			};
		};

		for (var j = 0; j < $scope.pushAliases.length; j++) {
			if ($scope.pushAliases[j].name) {
				$scope.testgroup.aliases.push($scope.pushAliases[j].name);
			};
		};

		var impParams = 'testgroup='+JSON.stringify($scope.testgroup);
		console.log(impParams);
		customHttp.request(impParams,'/api/testgroups/update','POST',function (data) {
			console.log(data.status);
			if(data.status){
				console.log(data);
				$location.path("/adminmedd/testgroups");
				Materialize.toast('Testgroup updated successfully', 2000);
			}
			else{

				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}

	$scope.discardChanges = function () {
		Materialize.toast('No changes made', 2000);
		$location.path("/adminmedd/testgroups");
	}

}])

//Admin Panel Transactions Control
.controller('AdminTransactionCtrl',['$scope', 'customHttp', function ($scope, customHttp){
	$scope.error = [];
	$scope.loading = true;
	$scope.transactions = [];
	loadTransactions();
	function loadTransactions() {
		$scope.activeDeleteIndex;
		customHttp.request('','/api/transactions/get','GET',function (data) {
			if(data.status){
				var allTransactions = data.data;
				$scope.transactions = [];
				$scope.diagnosticsTransactions = [];
				$scope.pharmacyTransactions = [];
				$scope.eventTransactions = [];

				for (var i = 0; i < allTransactions.length; i++) {
					if (allTransactions[i].version >= 4) {
						if (allTransactions[i].timestamp) {
							allTransactions[i].booking_time = {
								date : new Date(allTransactions[i].timestamp.booking).toLocaleDateString(),
								time : new Date(allTransactions[i].timestamp.booking).toLocaleTimeString()
							}
						};
						$scope.transactions.push(allTransactions[i]);
						if (allTransactions[i].type == 'diagnostics') {
							$scope.diagnosticsTransactions.push(allTransactions[i]);
						} else if (allTransactions[i].type == 'pharmacy') {
							$scope.pharmacyTransactions.push(allTransactions[i]);
						} else if (allTransactions[i].type == 'event') {
							$scope.eventTransactions.push(allTransactions[i]);
						};
						$scope.loading = false;
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

	$scope.changeDeliveryStatus = function (transaction) {
		console.log(transaction);

		var impParams = 'transaction='+transaction;
		customHttp.request(impParams,'/api/transactions/update','POST',function (data) {
			console.log(data);
			if(data.status){
				// $scope.transaction = data.data[0];
				Materialize.toast('Medicines delivery status updated successfully!', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! Some error occurred'+data.message, 2000);
			}
		})
	}
}])


.controller('AdminStatisticsCtrl', ['$scope', 'customHttp', '$filter', function ($scope, customHttp, $filter){
	$scope.loading = true;
	loadTransactions();
	function loadTransactions() {
		$scope.activeDeleteIndex;
		customHttp.request('','/api/transactions/get','GET',function (data) {
			if(data.status){
				var allTransactions = data.data;
				// $scope.statsTxnData = [
				// 	{
				// 		key : 'GMV',
				// 		values : []
				// 	}
				// ];
				$scope.diagnosticsTransactions = [];

				var updateDate = '';
				var updateDailyGMV = 0;
				var arr = [];
				var webNumber = 0;
				var androidNumber = 0;
				var webGMV = 0;
				var androidGMV = 0;

				for (var i = 0; i < allTransactions.length; i++) {
					if (allTransactions[i].version >= 4 && allTransactions[i].type == 'diagnostics') {
						if (allTransactions[i].timestamp) {
							if (allTransactions[i].timestamp.booking) {
								allTransactions[i].booking_time = {
									date : new Date(allTransactions[i].timestamp.booking).toLocaleDateString(),
									time : new Date(allTransactions[i].timestamp.booking).toLocaleTimeString()
								}
								var selectedInfo = {
									date : new Date(allTransactions[i].timestamp.booking).toLocaleDateString(),
									amount : allTransactions[i].diagnostics.price.user
								};
								if (i == 0) {
									updateDate = new Date(allTransactions[i].timestamp.booking).toLocaleDateString();
								};
								if (updateDate == new Date(allTransactions[i].timestamp.booking).toLocaleDateString()) {
									updateDailyGMV += allTransactions[i].diagnostics.price.user;
								} else {
									if (updateDate == NaN) {
										console.log('');
										console.log('Fuck');
										console.log(allTransactions[i]);
									};
									arr.push([Date.parse(updateDate), updateDailyGMV]);
									// $scope.statsTxnData[0].values.push(statsTxnData_values);

									updateDate = new Date(allTransactions[i].timestamp.booking).toLocaleDateString();
									updateDailyGMV = allTransactions[i].diagnostics.price.user;
								}
								// statsTxnData_values.push(new Date(allTransactions[i].timestamp.booking).toLocaleDateString());
								// statsTxnData_values.push(selectedInfo.amount);
								// $scope.statsTxnData[0].values.push(statsTxnData_values);
								$scope.diagnosticsTransactions.push(allTransactions[i]);
							};

							if (allTransactions[i].source) {
								if (allTransactions[i].source.type) {
									if (allTransactions[i].source.type == 'web') {
										webNumber ++;
										webGMV += allTransactions[i].diagnostics.price.user;
									} else if (allTransactions[i].source.type == 'android') {
										androidNumber ++;
										androidGMV += allTransactions[i].diagnostics.price.user;
									};
								};
							};
						};
					};
				};
				console.log(arr);
				$scope.statsTxnData = [
					{
						key : 'GMV',
						values : arr
					}
				];

				$scope.tractionNumbers = [
					{key : 'Web', y: webNumber},
					{key : 'Android', y: androidNumber}
					// {key : 'Web', y: 30},
					// {key : 'Android', y: 45}
				];
				$scope.tractionGMV = [
					{key : 'Web', y: webGMV},
					{key : 'Android', y: androidGMV}
					// {key : 'Web', y: 67},
					// {key : 'Android', y: 34}
				];
				
				$scope.loading = false;
				console.log($scope.diagnosticsTransactions);
				console.log($scope.statsTxnData);

			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
	$scope.exampleData = [
		{
			"key": "Growth",
			"values": [ [ 1025409600000 , 0] , [ 1028088000000 , -6.3382185140371] , [ 1030766400000 , -5.9507873460847] , [ 1033358400000 , -11.569146943813] , [ 1036040400000 , -5.4767332317425] , [ 1038632400000 , 0.50794682203014] , [ 1041310800000 , -5.5310285460542] , [ 1043989200000 , -5.7838296963382] , [ 1046408400000 , -7.3249341615649] , [ 1049086800000 , -6.7078630712489] , [ 1051675200000 , 0.44227126150934] , [ 1054353600000 , 7.2481659343222] , [ 1056945600000 , 9.2512381306992] , [ 1059624000000 , 11.341210982529] , [ 1062302400000 , 14.734820409020] , [ 1064894400000 , 12.387148007542] , [ 1067576400000 , 18.436471461827] , [ 1070168400000 , 19.830742266977] , [ 1072846800000 , 22.643205829887] , [ 1075525200000 , 26.743156781239] , [ 1078030800000 , 29.597478802228] , [ 1080709200000 , 30.831697585341] , [ 1083297600000 , 28.054068024708] , [ 1085976000000 , 29.294079423832] , [ 1088568000000 , 30.269264061274] , [ 1091246400000 , 24.934526898906] , [ 1093924800000 , 24.265982759406] , [ 1096516800000 , 27.217794897473] , [ 1099195200000 , 30.802601992077] , [ 1101790800000 , 36.331003758254] , [ 1104469200000 , 43.142498700060] , [ 1107147600000 , 40.558263931958] , [ 1109566800000 , 42.543622385800] , [ 1112245200000 , 41.683584710331] , [ 1114833600000 , 36.375367302328] , [ 1117512000000 , 40.719688980730] , [ 1120104000000 , 43.897963036919] , [ 1122782400000 , 49.797033975368] , [ 1125460800000 , 47.085993935989] , [ 1128052800000 , 46.601972859745] , [ 1130734800000 , 41.567784572762] , [ 1133326800000 , 47.296923737245] , [ 1136005200000 , 47.642969612080] , [ 1138683600000 , 50.781515820954] , [ 1141102800000 , 52.600229204305] , [ 1143781200000 , 55.599684490628] , [ 1146369600000 , 57.920388436633] , [ 1149048000000 , 53.503593218971] , [ 1151640000000 , 53.522973979964] , [ 1154318400000 , 49.846822298548] , [ 1156996800000 , 54.721341614650] , [ 1159588800000 , 58.186236223191] , [ 1162270800000 , 63.908065540997] , [ 1164862800000 , 69.767285129367] , [ 1167541200000 , 72.534013373592] , [ 1170219600000 , 77.991819436573] , [ 1172638800000 , 78.143584404990] , [ 1175313600000 , 83.702398665233] , [ 1177905600000 , 91.140859312418] , [ 1180584000000 , 98.590960607028] , [ 1183176000000 , 96.245634754228] , [ 1185854400000 , 92.326364432615] , [ 1188532800000 , 97.068765332230] , [ 1191124800000 , 105.81025556260] , [ 1193803200000 , 114.38348777791] , [ 1196398800000 , 103.59604949810] , [ 1199077200000 , 101.72488429307] , [ 1201755600000 , 89.840147735028] , [ 1204261200000 , 86.963597532664] , [ 1206936000000 , 84.075505208491] , [ 1209528000000 , 93.170105645831] , [ 1212206400000 , 103.62838083121] , [ 1214798400000 , 87.458241365091] , [ 1217476800000 , 85.808374141319] , [ 1220155200000 , 93.158054469193] , [ 1222747200000 , 65.973252382360] , [ 1225425600000 , 44.580686638224] , [ 1228021200000 , 36.418977140128] , [ 1230699600000 , 38.727678144761] , [ 1233378000000 , 36.692674173387] , [ 1235797200000 , 30.033022809480] , [ 1238472000000 , 36.707532162718] , [ 1241064000000 , 52.191457688389] , [ 1243742400000 , 56.357883979735] , [ 1246334400000 , 57.629002180305] , [ 1249012800000 , 66.650985790166] , [ 1251691200000 , 70.839243432186] , [ 1254283200000 , 78.731998491499] , [ 1256961600000 , 72.375528540349] , [ 1259557200000 , 81.738387881630] , [ 1262235600000 , 87.539792394232] , [ 1264914000000 , 84.320762662273] , [ 1267333200000 , 90.621278391889] , [ 1270008000000 , 102.47144881651] , [ 1272600000000 , 102.79320353429] , [ 1275278400000 , 90.529736050479] , [ 1277870400000 , 76.580859994531] , [ 1280548800000 , 86.548979376972] , [ 1283227200000 , 81.879653334089] , [ 1285819200000 , 101.72550015956] , [ 1288497600000 , 107.97964852260] , [ 1291093200000 , 106.16240630785] , [ 1293771600000 , 114.84268599533] , [ 1296450000000 , 121.60793322282] , [ 1298869200000 , 133.41437346605] , [ 1301544000000 , 125.46646042904] , [ 1304136000000 , 129.76784954301] , [ 1306814400000 , 128.15798861044] , [ 1309406400000 , 121.92388706072] , [ 1312084800000 , 116.70036100870] , [ 1314763200000 , 88.367701837033] , [ 1317355200000 , 59.159665765725] , [ 1320033600000 , 79.793568139753] , [ 1322629200000 , 75.903834028417] , [ 1325307600000 , 72.704218209157] , [ 1327986000000 , 84.936990804097] , [ 1330491600000 , 93.388148670744]]
		}
	];

	$scope.xAxisTickFormatFunction = function(){
		return function(d){
			// return d3.time.format('%x')(new Date(d)); //uncomment for date format
			return $filter('date')(new Date(d), 'dd MMM yyyy')
		}
	}

  var colorArray = ['#f00', '#aaa', '#bbb', '#ccc', '#ddd', '#eee', '#ededed'];
  $scope.colorFunction = function() {
	  return function(d, i) {
    	return colorArray[i];
    };
  };
  
  $scope.margin = function(){
    return {left:0,top:0,bottom:0,right:0};
  }

  $scope.xFunction = function() {
    return function(d) {
      return d.key;
    };
  };

  $scope.yFunction = function() {
    return function(d) {
      return d.y;
    };
  };

  $scope.exampleDataPie = [{
    key: "One",
    y: 5
  }, {
    key: "Two",
    y: 2
  }, {
    key: "Three",
    y: 9
  }, {
    key: "Four",
    y: 7
  }, {
    key: "Five",
    y: 4
  }, {
    key: "Six",
    y: 3
  }, {
    key: "Seven",
    y: 9
  }];
}])

//Admin Panel Transactions Control
.controller('AdminTransactionViewCtrl',['$scope', '$location', 'customHttp', '$stateParams', 'fileUpload', function ($scope, $location, customHttp, $stateParams, fileUpload){
	$scope.error = [];
	var transaction_id = $stateParams.transaction_id;
	console.log(transaction_id);
	loadTransaction();
	function loadTransaction () {
		var impParams = 'id='+transaction_id;
		customHttp.request(impParams,'/api/transactions/getbyid','GET',function (data) {
			// console.log(data);
			if(data.status){
				$scope.transaction = data.data[0];
				console.log($scope.transaction);
				$scope.patient = $scope.transaction.patient;
				$scope.lab = $scope.transaction.diagnostics;
				var timestamp = new Date($scope.transaction.timestamp.booking);
				$scope.booking_time = {
					date : timestamp.toLocaleDateString(),
					time : timestamp.toLocaleTimeString()
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

.controller('AdminDistanceCtrl',['$scope', 'customHttp', function ($scope, customHttp, $timeout){

var origin = new google.maps.LatLng(55.930, -3.118);
var destination = new google.maps.LatLng(50.087, 14.421);

$scope.calculateDistances = function () {
	console.log('jgcgvj');
	var service = new google.maps.DistanceMatrixService();
	service.getDistanceMatrix(
	{
		origins: [origin],
		destinations: [destination],
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.METRIC,
		avoidHighways: false,
		avoidTolls: false
	}, callback);
}

function callback(response, status) {
	if (status) {
		console.log(response);
		console.log(response.rows[0].elements[0]);
		$scope.matrix = response.rows[0].elements[0];
		$scope.distance = $scope.matrix.distance.value;
		$scope.duration = $scope.matrix.duration.value;
	};
}

}])

.controller('AdminPharmacyCtrl',['$scope', '$rootScope', 'customHttp', 'fileUpload', function ($scope, $root, customHttp, fileUpload){
	console.log($root.adminSession);
	$scope.loading = true;
	$scope.error = [];
	$scope.pharmacies = [];
	$scope.added = false;
	$scope.pharmacy = {
		name : '',
		email : '',
		phone : '',
		address : '',
		rating : '',
		facilities : {
			home_collection : false,
			credit_card : false,
			insurance : false,
			ac : true,
			parking : true,
			fullday : false
		},
		geolocation : {
			latitude : 22.7,
			longitude : 75.9
		},
		timing : {
			days : {
				sun : true,
				mon : true,
				tue : true,
				wed : true,
				thu : true,
				fri : true,
				sat : true
			},
			time : {
				from 	: '10 AM',
				to 		: '8 PM'
			}
		},
		cover : ''
	}
	loadPharmacies();
	function loadPharmacies() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/pharmacies/get','GET',function (data) {
			if(data.status){
				if (data.data) {
					$scope.pharmacies = data.data;
					$scope.loading = false;
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
	
	$scope.addPharmacy = function () {
		var nd = new Date();
		$scope.pharmacy.created_on = nd;

		console.log($scope.pharmacy);

		var pharmacyParams = 'pharmacy='+JSON.stringify($scope.pharmacy);
		console.log(pharmacyParams);
		customHttp.request(pharmacyParams,'/api/pharmacies/create','POST',function (data) {
			console.log(data.status);
			if(data.status){
				$scope.pharmacies.push(data.data);
				loadPharmacies();
				var pharmacy_id = data.pharmacy;
				console.log(pharmacy_id);
		        var coverParams = $scope.cover;
		        $scope.$watch('cover', function () {
		        	console.log($scope.console);
		        })
		        Materialize.toast('Pharmacy added successfully!', 2000);
		        if ($scope.cover) {
					fileUpload.upload(coverParams,'/api/pharmacies/uploadprescription', '', pharmacy_id ,function (data2) {
					// fileUpload.upload(coverParams,'/api/pharmacies/updatecover', '', pharmacy_id ,function (data2) {
						if(data2.status){
							console.log('File upload succeeded!')
							console.log(data2);
							document.getElementById('newpharmacy').reset();
							Materialize.toast('Image uploaded successfully!', 2000);
						}
						else{
							console.log('File upload failed!')
							$scope.error.push({
								type : 'fail',
								message: data2.message
							})
							console.log($scope.error[0]);
							Materialize.toast('Image could not be uploaded', 2000);
						}
					})
		        };
				console.log(data);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.deletePharmacy = function (pharmacy_id) {
		$scope.pharmacyToBeDeleted = pharmacy_id;
		$('#deletePharmacyModal').openModal();
	}

	$scope.deleteYes = function (pharmacy_id) {
		var impParams = 'id='+pharmacy_id;
		$('#deletePharmacyModal').closeModal();
		customHttp.request(impParams,'/api/pharmacies/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('Successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.pharmacies.forEach(function(pharmacy){
					if( pharmacy._id == pharmacy_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.pharmacies.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		$scope.pharmacyToBeDeleted = '';
		$('#deletePharmacyModal').closeModal();
	}

	$scope.changePublish =  function (pharmacy) {
		console.log(pharmacy.publish);
		var impParams = 'pharmacy='+JSON.stringify(pharmacy);
		console.log(impParams);
		customHttp.request(impParams,'/api/pharmacies/update','POST',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('Pharmacy publish change made!', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0].message);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}
}])
.controller('AdminPharmacyEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', 'fileUpload', function ($scope, $location, customHttp, $stateParams, fileUpload){
	$scope.error = [];
	loadPharmacy();
	function loadPharmacy () {
		var pharmacy_id = $stateParams.id;
		var impParams = 'id='+pharmacy_id;
		customHttp.request(impParams,'/api/pharmacies/getbyid','GET',function (data) {
			if(data.status){
				$scope.pharmacy = data.data[0];
				console.log($scope.pharmacy);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.updatePharmacy = function () {
		var impParams = 'pharmacy='+JSON.stringify($scope.pharmacy);
		console.log(impParams);
		customHttp.request(impParams,'/api/pharmacies/update','POST',function (data) {
			if(data.status){
				console.log(data);
				$location.path("/adminmedd/pharmacies");
				Materialize.toast('Pharmacy updated successfully!', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
		if ($scope.cover) {
	        var coverParams = $scope.cover;
			fileUpload.upload(coverParams,'/api/pharmacies/updatecover','' ,$scope.pharmacy._id ,function (data) {
				if(data.status){
					console.log('File upload succeeded!')
					console.log(data);
					// $location.path("/adminmedd/pharmacies");
					Materialize.toast('Image uploaded successfully!', 2000);
				}
				else{
					console.log('File upload failed!')
					$scope.error.push({
						type : 'fail',
						message: data.message
					})
					console.log($scope.error.length);
					console.log($scope.error[0]);
					Materialize.toast('Image could not be uploaded!', 2000);
				}
			})
		};
	}

	$scope.discardChanges = function () {
		$location.path("/adminmedd/pharmacies");
	}
}])

.filter('propsFilter', function() {
  return function(items, props) {
	var out = [];

	if (angular.isArray(items)) {
	  items.forEach(function(item) {
		var itemMatches = false;

		var keys = Object.keys(props);
		for (var i = 0; i < keys.length; i++) {
		  var prop = keys[i];
		  var text = props[prop].toLowerCase();
		  if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
			itemMatches = true;
			break;
		  }
		}

		if (itemMatches) {
		  out.push(item);
		}
	  });
	} else {
	  // Let the output be the input untouched
	  out = items;
	}

	return out;
  };
})

.controller('AdminHealthPackageCtrl',['$scope', 'customHttp', 'fileUpload', 'docReady', function ($scope, customHttp, fileUpload, docReady){
	$scope.error = [];
	$scope.loading = true;
	$scope.healthPackages = [];
	$scope.added = false;
	$scope.healthPackage = {
		type : 'diagnostics',
		name : '',
		description : '',
		cover : '',
		lab : '',
		labs : [],
		testgroup : '',
		timestamp : {},
		selectedTestgroups : []
	}
	$scope.main_labs = [
		{name : 'Thyrocare'},
		{name : 'Nucleus'},
		{name : 'Bhatia'},
		{name : 'Onquest'},
		{name : 'Spectrum'},
		{name : 'Central Lab'},
		{name : 'Vision Diagnostic Centre'},
		{name : 'Reiable Diagnostic Centre'}
	]
	loadCities();
	function loadCities() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/cities/get','GET',function (data) {
			if(data.status){
				$scope.cities = data.data;
				console.log($scope.cities);
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

	loadLabs();
	function loadLabs() {
		customHttp.request('','/api/labs/get','GET',function (data) {
			if(data.status){
				$scope.labs = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	loadTestgroups();
	function loadTestgroups() {
		customHttp.request('','/api/testgroups/get','GET',function (data) {
			if(data.status){
				$scope.testgroups = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	loadHealthPackages();
	function loadHealthPackages() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/healthPackages/get','GET',function (data) {
			if(data.status){
				$scope.healthPackages = data.data;
				if ($scope.healthPackages == null) {
					$scope.healthPackages = [];
				}
				console.log($scope.healthPackages);
				$scope.loading = false;
				docReady.run();
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$('input[type=file]').change(function () {
	    console.log($scope.cover);
	});


	
	$scope.addHealthPackage = function () {
		$scope.healthPackage.timestamp.creation = new Date();
		for (var i = 0; i < $scope.healthPackage.labs.length; i++) {
			if ($scope.healthPackage.labs[i].geolocation) {
				var latitude = $scope.healthPackage.labs[i].geolocation.latitude;
				var longitude = $scope.healthPackage.labs[i].geolocation.longitude;
			};
			$scope.healthPackage.labs[i] = {
				_id : $scope.healthPackage.labs[i]._id,
				name : $scope.healthPackage.labs[i].name,
				email : $scope.healthPackage.labs[i].email,
				phone : $scope.healthPackage.labs[i].phone,
				address : $scope.healthPackage.labs[i].address,
				geolocation : {
					latitude : latitude,
					longitude : longitude
				}
			}
		};
		for (var i = 0; i < $scope.healthPackage.testgroups.length; i++) {
			$scope.healthPackage.testgroups[i] = {
				_id : $scope.healthPackage.testgroups[i]._id,
				name : $scope.healthPackage.testgroups[i].name,
				tests : $scope.healthPackage.testgroups[i].tests
			}
		};
		console.log($scope.healthPackage);

		var healthPackageParams = 'healthPackage='+JSON.stringify($scope.healthPackage);
		console.log(healthPackageParams);
		customHttp.request(healthPackageParams,'/api/healthPackages/create','POST',function (data) {
			console.log(data.status);
			if(data.status){
				$scope.healthPackage = {};
				Materialize.toast('HealthPackage added successfully', 2000);
				var coverParams = $scope.cover;
				if (coverParams!=undefined) {
					var healthPackage_id = data.healthPackage;
					console.log(healthPackage_id);
					fileUpload.upload(coverParams,'/api/healthPackages/updatecover', healthPackage_id, '' ,function (data2) {
						console.log(data2);
						if(data2.status){
							console.log('File upload succeeded!')
							console.log(data2);
							document.getElementById('newhealthPackage').reset();
							Materialize.toast('Image uploaded successfully!', 2000);
						}
						else{
							Materialize.toast('Image could not be uploaded', 2000);
						}
					})
				}
				console.log(data);
				$scope.healthPackages.push(data.data);
				loadHealthPackages();
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.deleteHealthPackage = function (healthPackage_id) {
		$scope.healthPackageToBeDeleted = healthPackage_id;
		$('#deleteHealthPackageModal').openModal();
	}

	$scope.deleteYes = function (healthPackage_id) {
		var impParams = 'id='+healthPackage_id;
		$('#deleteHealthPackageModal').closeModal();
		customHttp.request(impParams,'/api/healthPackages/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('HealthPackage successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.healthPackages.forEach(function(healthPackage){
					if( healthPackage._id == healthPackage_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.healthPackages.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		$scope.healthPackageToBeDeleted = '';
		$('#deleteHealthPackageModal').closeModal();
	}

	$scope.changePublish =  function (healthPackage) {
		var impParams = 'healthPackage='+JSON.stringify(healthPackage);
		console.log(impParams);
		customHttp.request(impParams,'/api/healthPackages/update','POST',function (data) {
			if(data.status){
				Materialize.toast('HealthPackage publish change made!', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0].message);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}
}])
// .controller('AdminHealthPackageEditCtrl',['$scope', 'customHttp', 'fileUpload', 'docReady', function ($scope, customHttp, fileUpload, docReady){
.controller('AdminHealthPackageEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', 'fileUpload', 'docReady', function ($scope, $location, customHttp, $stateParams, fileUpload, docReady){
	$scope.error = [];
	$scope.loading = true;
	$scope.healthPackages = [];
	$scope.added = false;
	$scope.healthPackage = {
		type : 'diagnostics',
		name : '',
		description : '',
		cover : '',
		lab : '',
		labs : [],
		testgroup : '',
		timestamp : {},
		selectedTestgroups : []
	}
	$scope.main_labs = [
		{name : 'Thyrocare'},
		{name : 'Nucleus'},
		{name : 'Bhatia'},
		{name : 'Onquest'},
		{name : 'Spectrum'},
		{name : 'Central Lab'},
		{name : 'Vision Diagnostic Centre'},
		{name : 'Reiable Diagnostic Centre'}
	]
	loadCities();
	function loadCities() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/cities/get','GET',function (data) {
			if(data.status){
				$scope.cities = data.data;
				console.log($scope.cities);
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

	loadLabs();
	function loadLabs() {
		customHttp.request('','/api/labs/get','GET',function (data) {
			if(data.status){
				$scope.labs = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	loadTestgroups();
	function loadTestgroups() {
		customHttp.request('','/api/testgroups/get','GET',function (data) {
			if(data.status){
				$scope.testgroups = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	loadHealthPackage();
	function loadHealthPackage () {
		var healthPackage_id = $stateParams.id;
		var impParams = 'id='+healthPackage_id;
		customHttp.request(impParams,'/api/healthPackages/getbyid','GET',function (data) {
			if(data.status){
				$scope.healthPackage = data.data[0];
				console.log($scope.healthPackage);
				docReady.run(1);
				if (!$scope.healthPackage.cover) {
					$scope.healthPackage.cover = {
						image : ''
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

	$scope.$watch('cover', function() {
		console.log('jhvwef');
		console.log($scope.cover);
		if ($scope.cover) {
			$scope.healthPackage.cover.image = $scope.cover.name;
		};
	});

	$scope.updateHealthPackage = function () {
		$scope.healthPackage.timestamp.creation = new Date();
		for (var i = 0; i < $scope.healthPackage.labs.length; i++) {
			if ($scope.healthPackage.labs[i].geolocation) {
				var latitude = $scope.healthPackage.labs[i].geolocation.latitude;
				var longitude = $scope.healthPackage.labs[i].geolocation.longitude;
			};
			$scope.healthPackage.labs[i] = {
				_id : $scope.healthPackage.labs[i]._id,
				name : $scope.healthPackage.labs[i].name,
				email : $scope.healthPackage.labs[i].email,
				phone : $scope.healthPackage.labs[i].phone,
				address : $scope.healthPackage.labs[i].address,
				geolocation : {
					latitude : latitude,
					longitude : longitude
				}
			}
		};
		for (var i = 0; i < $scope.healthPackage.testgroups.length; i++) {
			$scope.healthPackage.testgroups[i] = {
				_id : $scope.healthPackage.testgroups[i]._id,
				name : $scope.healthPackage.testgroups[i].name,
				tests : $scope.healthPackage.testgroups[i].tests
			}
		};
		console.log($scope.healthPackage);

		var impParams = 'healthPackage='+JSON.stringify($scope.healthPackage);
		console.log(impParams);
		customHttp.request(impParams, '/api/healthPackages/update', 'POST', function (data) {
			console.log(data.status);
			if(data.status){
				console.log(data);
				$scope.healthPackage = {};
				$location.path("/adminmedd/healthPackages");
				Materialize.toast('HealthPackage uploaded successfully', 2000);
				var coverParams = $scope.cover;
				if (coverParams!=undefined) {
					var healthPackage_id = data.data._id;
					console.log(healthPackage_id);
					fileUpload.upload(coverParams,'/api/healthPackages/updatecover', '', healthPackage_id ,function (data2) {
						if(data2.status){
							console.log('File upload succeeded!')
							console.log(data2);
							document.getElementById('newhealthPackage').reset();
							Materialize.toast('Image uploaded successfully!', 2000);
						}
						else{
							console.log('File upload failed!')
							$scope.error.push({
								type : 'fail',
								message: data2.message
							})
							console.log($scope.error[0]);
							Materialize.toast('Image could not be uploaded', 2000);
						}
					})
				}
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.discardChanges = function () {
		$location.path("/adminmedd/healthPackages");
	}

}])

.controller('AdminEventCtrl',['$scope', 'customHttp', 'fileUpload', 'docReady', function ($scope, customHttp, fileUpload, docReady){
	$scope.error = [];
	$scope.events = [];
	$scope.added = false;

	$scope.event = {
		type : 'diagnostics',
		name : '',
		description : '',
		cover : '',
		timestamp : {}
	}
	$scope.insertSubEvent = function () {
		$scope.pushSubEvent.push({});
		console.log($scope.pushSubEvent);
	};
	
	$scope.removeSubEvent = function (index, pushSubEvent) {
		$scope.pushSubEvent.splice(index,1);
		console.log($scope.pushSubEvent);
	}	
	// $('.datepicker').pickadate({
	// 	// selectMonths: true, // Creates a dropdown to control month
	// 	// selectYears: 1 // Creates a dropdown of 15 years to control year
	// });
	loadLabs();
	function loadLabs() {
		customHttp.request('','/api/labs/get','GET',function (data) {
			if(data.status){
				$scope.labs = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
	loadTestgroups();
	function loadTestgroups() {
		customHttp.request('','/api/testgroups/get','GET',function (data) {
			if(data.status){
				$scope.testgroups = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
	loadEvents();
	function loadEvents() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/events/get','GET',function (data) {
			if(data.status){

				$scope.events = data.data;
				docReady.run();
				if ($scope.events == null) {
					$scope.events = [];
				}
				console.log($scope.events);
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

	$('input[type=file]').change(function () {
	    console.log($scope.cover);
	});
	
	$scope.addEvent = function () {
		$scope.event.timestamp = new Date();
		console.log($scope.event);

		// for (var j = 0; j < $scope.pushSubEvent.length; j++) {
		// 	if ($scope.pushSubEvent[j].subevent) {
		// 		var subevent = {
		// 			subeventid : $scope.pushSubEvent[j].subevent.subeventid;
		// 			name: $scope.pushSubEvent[j].subevent.name;
		// 			price : $scope.pushSubEvent[j].subevent.price;
		// 		}
		// 	};
		// };

		// for (var i = 0; i < $scope.event.subevent.length; i++) {
		// 	$scope.subevent.testgroups[i] = {
		// 		_id : $scope.event.subevent.testgroups[i]._id,
		// 		name : $scope.event.subevent.testgroups[i].name,
		// 		tests : $scope.event.subevent.testgroups[i].tests
		// 	}
		// };
        $scope.event.testgroup=$scope.eventTestgroups;
        $scope.temp={};
		var eventParams = 'event='+JSON.stringify($scope.event);
		console.log(eventParams);
		customHttp.request(eventParams,'/api/events/create','POST',function (data) {
			console.log(data.status);
			if(data.status){

				var event_id = data.event;
				console.log(event_id);
				Materialize.toast('Event added successfully', 2000);

				$scope.events.push(data.data);
				loadEvents();
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.deleteEvent = function (event_id) {
		$scope.eventToBeDeleted = event_id;
		$('#deleteEventModal').openModal();
	}

	$scope.deleteYes = function (event_id) {
		var impParams = 'id='+event_id;
		$('#deleteEventModal').closeModal();
		customHttp.request(impParams,'/api/events/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('Event successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.events.forEach(function(event){
					if( event._id == event_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.events.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		$scope.eventToBeDeleted = '';
		$('#deleteEventModal').closeModal();
	}

	$scope.changePublish =  function (event) {
		var impParams = 'event='+JSON.stringify(event);
		console.log(impParams);
		customHttp.request(impParams,'/api/events/update','POST',function (data) {
			if(data.status){
				Materialize.toast('Event publish change made!', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0].message);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}
}])
.controller('AdminEventEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', 'fileUpload', function ($scope, $location, customHttp, $stateParams, fileUpload){
	$scope.error = [];
	loadEvent();
	function loadEvent () {
		var event_id = $stateParams.id;
		var impParams = 'id='+event_id;
		customHttp.request(impParams,'/api/events/getbyid','GET',function (data) {
			if(data.status){
				$scope.event = data.data[0];
				console.log($scope.event);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
	loadLabs();
	function loadLabs() {
		customHttp.request('','/api/labs/get','GET',function (data) {
			if(data.status){
				$scope.labs = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}
	loadTestgroups();
	function loadTestgroups() {
		customHttp.request('','/api/testgroups/get','GET',function (data) {
			if(data.status){
				$scope.testgroups = data.data;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.updateEvent = function () {

		var impParams = 'event='+JSON.stringify($scope.event);
		console.log(impParams);
		customHttp.request(impParams,'/api/events/update','POST',function (data) {
			if(data.status){
				console.log(data);
				$location.path("/adminmedd/events");
			}
			else{

				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
			}
		})

        var coverParams = $scope.cover;
        console.log(coverParams);
        if (coverParams!=undefined) {
			fileUpload.upload(coverParams,'/api/events/updatecover', $scope.event._id, '' ,function (data) {
				if(data.status){
					console.log('File upload succeeded!')
					console.log(data);
					// $location.path("/adminmedd/events");
				}
				else{
					console.log('File upload failed!')
					$scope.error.push({
						type : 'fail',
						message: data.message
					})
					console.log($scope.error.length);
					console.log($scope.error[0]);
				}
			})
        };
	}

	$scope.discardChanges = function () {
		$location.path("/adminmedd/events");
	}

}])

.controller('AdminFeedbackCtrl',['$scope', 'customHttp', 'fileUpload', 'docReady', function ($scope, customHttp, fileUpload, docReady){
	$scope.error = [];
	$scope.loading = true;
	$scope.feedbacks = [];
	loadFeedbacks();
	function loadFeedbacks() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/feedbacks/get','GET',function (data) {
			if(data.status){
				if (data.data) {
					$scope.feedbacks = data.data;
					for (var i = 0; i < $scope.feedbacks.length; i++) {
						console.log($scope.feedbacks[i].timestamp);
						$scope.feedbacks[i].timestamp = new Date($scope.feedbacks[i].timestamp);
						console.log($scope.feedbacks[i].timestamp);
						if ($scope.feedbacks[i].timestamp) {
							$scope.feedbacks[i].datetime = {
								date : new Date($scope.feedbacks[i].timestamp).toLocaleDateString(),
								time : new Date($scope.feedbacks[i].timestamp).toLocaleTimeString()
							}
						};
					};
				};
				docReady.run();
				console.log($scope.feedbacks);
				$scope.loading = false;
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteFeedback = function (feedback_id) {
		$scope.feedbackToBeDeleted = feedback_id;
		$('#deleteFeedbackModal').openModal();
	}

	$scope.deleteYes = function (feedback_id) {
		var impParams = 'id='+feedback_id;
		$('#deleteFeedbackModal').closeModal();
		customHttp.request(impParams,'/api/feedbacks/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('Feedback successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.feedbacks.forEach(function(feedback){
					if( feedback._id == feedback_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.feedbacks.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		$scope.feedbackToBeDeleted = '';
		$('#deleteFeedbackModal').closeModal();
	}
}])

// Admin Panel Users Controller
.controller('AdminUserCtrl',['$scope', 'customHttp', 'docReady', function ($scope, customHttp, docReady){
	$scope.error = [];
	$scope.loading = true;
	$scope.users = [];
	$scope.predicate = 'name';
	$scope.pushTests = [{}];
	loadUsers();
	function loadUsers() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/users/get','GET',function (data) {
			if(data.status){
				$scope.users = data.data;
				console.log($scope.users);
				$scope.loading = false;
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

// Admin Panel Subscriptions Controller
.controller('AdminSubscriptionCtrl',['$scope', 'customHttp', 'docReady', function ($scope, customHttp, docReady){
	$scope.error = [];
	$scope.subscriptions = [];
	loadSubscriptions();
	function loadSubscriptions() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/subscriptions/get','GET',function (data) {
			if(data.status){
				$scope.subscriptions = data.data;
			}
			else{
				console.log('Subscriptions could not be loaded')
			}
		})
	}
}])

// Admin Panel Cities Controller
.controller('AdminCityCtrl',['$scope', 'customHttp', 'docReady', function ($scope, customHttp, docReady){
	console.log('City controller')
	$scope.error = [];
	$scope.cities = [];
	$scope.predicate = 'name';
	$scope.city = {}
	$scope.city.common_range = true;
	loadCities();
	function loadCities() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/cities/get','GET',function (data) {
			if(data.status){
				$scope.cities = data.data;
				console.log($scope.cities);
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
	$scope.addCity = function () {
		loadCities();
		var nd = new Date();

		var impParams = 'city='+JSON.stringify($scope.city);
		console.log(impParams);
		customHttp.request(impParams,'/api/cities/create','POST',function (data) {
			console.log(data.status);
			if(data.status){
				document.getElementById('newcity').reset();
				$scope.city = {}
				$scope.city.common_range = true;
				console.log(data);
				$scope.cities.push(data.data);
				loadCities();
				Materialize.toast('City added successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.changePublish =  function (city) {
		console.log(city.publish);
		// $scope.changePublish = true;

	}

	$scope.deleteCity = function (city_id) {
		console.log('confirm deletion of ' + city_id);
		$scope.cityToBeDeleted = city_id;
		$('#deleteCityModal').openModal();
		console.log($scope.cityToBeDeleted);
	}

	$scope.deleteYes = function (city_id) {
		console.log('yoooooooooo');
		$scope.cityToBeDeleted = '';
		$('#deleteCityModal').closeModal();
		console.log('final deletion of ' + city_id);
		var impParams = 'id='+city_id;
		customHttp.request(impParams,'/api/cities/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('City successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.cities.forEach(function(city){
					if( city._id == city_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.cities.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		console.log('cancel deletion of ' + $scope.cityToBeDeleted);
		$scope.cityToBeDeleted = '';
		$('#deleteCityModal').closeModal();
	}

	$scope.updateCity = function (city) {
		var impParams = 'city='+JSON.stringify(city);
		customHttp.request(impParams,'/api/cities/update','POST',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('City updated successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}
}])
.controller('AdminCityEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', function ($scope, $location, customHttp, $stateParams){
	$scope.error = [];
	cityEdit();
	function cityEdit () {
		var city_id = $stateParams.id;
		var impParams = 'id='+city_id;
		customHttp.request(impParams,'/api/cities/getbyid','GET',function (data) {
			if(data.status){
				$scope.city = data.data[0];
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.updateCity = function (city) {
		var impParams = 'city='+JSON.stringify(city);
		console.log(impParams);
		customHttp.request(impParams,'/api/cities/update','POST',function (data) {
			console.log(data.status);
			if(data.status){
				console.log(data);
				$location.path("/adminmedd/cities");
				Materialize.toast('City updated successfully', 2000);
			}
			else{

				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}

	$scope.discardChanges = function () {
		Materialize.toast('No changes made', 2000);
		$location.path("/adminmedd/cities");
	}

}])

// Admin Panel Categories Controller
.controller('AdminCategoryCtrl', ['$scope', 'customHttp', 'docReady', function ($scope, customHttp, docReady){
	console.log('Category controller')
	$scope.error = [];
	$scope.categories = [];
	$scope.predicate = 'name';
	$scope.category = {}
	$scope.category.common_range = true;
	loadCategories();
	function loadCategories() {
		$scope.activeDeleteIndex;
		$scope.changePublish = false;
		customHttp.request('','/api/categories/get','GET',function (data) {
			if(data.status){
				$scope.categories = data.data;
				console.log($scope.categories);
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
	$scope.addCategory = function () {
		loadCategories();
		var nd = new Date();

		var impParams = 'category='+JSON.stringify($scope.category);
		console.log(impParams);
		customHttp.request(impParams,'/api/categories/create','POST',function (data) {
			console.log(data);
			console.log(data.status);
			if(data.status){
				document.getElementById('newcategory').reset();
				$scope.category = {}
				$scope.category.common_range = true;
				console.log(data);
				$scope.categories.push(data.data);
				loadCategories();
				Materialize.toast('Category added successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	};

	$scope.changePublish =  function (category) {
		console.log(category.publish);
		// $scope.changePublish = true;

	}

	$scope.deleteCategory = function (category_id) {
		console.log('confirm deletion of ' + category_id);
		$scope.categoryToBeDeleted = category_id;
		$('#deleteCategoryModal').openModal();
		console.log($scope.categoryToBeDeleted);
	}

	$scope.deleteYes = function (category_id) {
		console.log('yoooooooooo');
		$scope.categoryToBeDeleted = '';
		$('#deleteCategoryModal').closeModal();
		console.log('final deletion of ' + category_id);
		var impParams = 'id='+category_id;
		customHttp.request(impParams,'/api/categories/remove','POST',function (data) {
			if(data.status){
				Materialize.toast('Category successfully deleted!', 2000);
				var index = -1, i=0;
				$scope.categories.forEach(function(category){
					if( category._id == category_id ){
					  index = i;
					}
					i++;
				});
				if( index >= 0 ){
					$scope.categories.splice(index,1);
				}
			}
			else{
				console.log("Some error");
				Materialize.toast('Sorry! There occurred some error', 2000);
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.deleteNo = function () {
		console.log('cancel deletion of ' + $scope.categoryToBeDeleted);
		$scope.categoryToBeDeleted = '';
		$('#deleteCategoryModal').closeModal();
	}

	$scope.updateCategory = function (category) {
		var impParams = 'category='+JSON.stringify(category);
		customHttp.request(impParams,'/api/categories/update','POST',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('Category updated successfully', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}
}])
.controller('AdminCategoryEditCtrl',['$scope', '$location', 'customHttp', '$stateParams', function ($scope, $location, customHttp, $stateParams){
	$scope.error = [];
	categoryEdit();
	function categoryEdit () {
		var category_id = $stateParams.id;
		var impParams = 'id='+category_id;
		customHttp.request(impParams,'/api/categories/getbyid','GET',function (data) {
			if(data.status){
				$scope.category = data.data[0];
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
			}
		})
	}

	$scope.updateCategory = function (category) {
		var impParams = 'category='+JSON.stringify(category);
		console.log(impParams);
		customHttp.request(impParams,'/api/categories/update','POST',function (data) {
			console.log(data.status);
			if(data.status){
				console.log(data);
				$location.path("/adminmedd/categories");
				Materialize.toast('Category updated successfully', 2000);
			}
			else{

				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
				Materialize.toast('Sorry! There occurred some error', 2000);
			}
		})
	}

	$scope.discardChanges = function () {
		Materialize.toast('No changes made', 2000);
		$location.path("/adminmedd/categories");
	}

}])

.controller('AdminVersionCtrl',['$scope', 'customHttp', function ($scope, customHttp){
	loadVersion();
	function loadVersion () {
		customHttp.request('','/api/versions/get','GET',function (data) {
			console.log(data);
			if(data.status){
				$scope.version = data.data[0];
				console.log(data.data[0]);
			}
			else{
				Materialize.toast('Sorry! Some error occurred', 2000);
			}
		})
	}

	$scope.updateVersion = function () {
		var versionParams = '_id='+$scope.version._id+'&android='+$scope.version.android;
		console.log(versionParams);
		customHttp.request(versionParams,'/api/versions/update','POST',function (data) {
			if(data.status){
				console.log(data);
				Materialize.toast('Successfully updated version!', 2000);
			}
			else{
				$scope.error.push({
					type : 'fail',
					message: data.message
				})
				console.log($scope.error.length);
				console.log($scope.error[0]);
				Materialize.toast('Sorry! Some error occurred', 2000);
			}
		})
	}
}])

.controller('AdminTncCtrl',['$scope', 'customHttp', function ($scope, customHttp){
	$scope.error = [];
	console.log('TNC');
	$scope.options = {
		language: 'en',
		allowedContent: true,

		forceSimpleAmpersand: true,
		entities: false,
		basicEntities: false,
		entities_greek: false,
		entities_latin: false
	};
	$scope.onReady = function () {
		$scope.toBeAdded = false;
		loadOthers();
		function loadOthers () {
			customHttp.request('','/api/others/get','GET',function (data) {
				console.log(data);
				if(data.status && data.data){
					if (data.data.length>0) {
						$scope.others = data.data[0];
						console.log($scope.others);
						if (!$scope.others.cities.length) {
							console.log('Cities array empty');
							$scope.others.cities.push({name : 'Indore'})
						};
					} else {
						// $scope.version = data.data[0];
						// console.log(data.data[0]);
						console.log('Create some')
					}

				}
				else{
					Materialize.toast('Sorry! Something went wrong', 2000);
				}
			})
		}



		$scope.updateTnc = function () {
			console.log($scope.others.tnc.content);
			if ($scope.toBeAdded) {
				var tncParams ='content='+$scope.others.tnc.content;
				console.log(tncParams);
				customHttp.request(tncParams,'/api/others/create','POST',function (data) {
					if(data.status){
						console.log(data);
						Materialize.toast('Successfully updated tnc!', 2000);
					}
					else{
						$scope.error.push({
							type : 'fail',
							message: data.message
						})
						console.log($scope.error.length);
						console.log($scope.error[0]);
						Materialize.toast('Sorry! Some error occurred', 2000);
					}
				})
			} else {
				var tncParams = 'others='+JSON.stringify($scope.others);
				console.log(tncParams);
				customHttp.request(tncParams,'/api/others/updatetnc','POST',function (data) {
					if(data.status){
						console.log(data);
						Materialize.toast('Successfully updated tnc!', 2000);
					}
					else{
						$scope.error.push({
							type : 'fail',
							message: data.message
						})
						console.log($scope.error.length);
						console.log($scope.error[0]);
						Materialize.toast('Sorry! Some error occurred', 2000);
					}
				})
			}
		}

		$scope.updateCities = function () {
			var citiesParams = 'cities='+JSON.stringify($scope.cities);
			console.log(citiesParams);
			customHttp.request(citiesParams,'/api/others/updatecities','POST',function (data) {
				if(data.status){
					console.log(data);
					Materialize.toast('Successfully updated tnc!', 2000);
				}
				else{
					$scope.error.push({
						type : 'fail',
						message: data.message
					})
					console.log($scope.error.length);
					console.log($scope.error[0]);
					Materialize.toast('Sorry! Some error occurred', 2000);
				}
			})
		}
	}
}])