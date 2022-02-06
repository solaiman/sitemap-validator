var request = require('request');
var parseString = require('xml2js').parseString;
var util = require('util');
var async = require('async');

var q = async.queue(function (task, next) {

    if(task.type == 'sitemap'){
      validateSitemap(task, function () {
          // after this one is done, start next one.
          next();
      });
    }
    else{
      validateUrl(task, function () {
          // after this one is done, start next one.
          next();
      });
    }

}, 4);

exports.CheckSitemap = function(url, code, source, destination, callback){
  request.get(url, function(error, response, body){
    if(error) {
      throw err;
    }

    if(response.statusCode != code) {
      console.log(response.statusCode + "," + url);
      callback();
      return;
    }

    // we've got the base sitemap file
    // This can either be a list of URLs or
    // a list of other sitemaps.

    parseString(body, function(err, result){
      if(err){
        console.log('Bad sitemap data, ' + url);
        callback();
        return;
      }

      if(result.hasOwnProperty('sitemapindex'))
      {
        for(var prop in result['sitemapindex']['sitemap'])
        {
          var sitemapUrl = result['sitemapindex']['sitemap'][prop].loc[0];
          q.push({url: sitemapUrl, code: code, type: 'sitemap', source: source, destination: destination});
        }
      }

      if(result.hasOwnProperty('urlset'))
      {
          for(var prop in result['urlset']['url'])
          {
            var testurl = result['urlset']['url'][prop].loc[0];
            q.push({url: testurl, code: code, type: 'url', source: source, destination: destination});
          }
      }

      callback();
      return;

    });

  });
}

exports.CheckSitemapText = function name(params) {
  parseString(params, function(err, result){
    if(err){
      console.log('Bad sitemap data, ' + url);
      callback();
      return;
    }

    if(result.hasOwnProperty('sitemapindex'))
    {
      for(var prop in result['sitemapindex']['sitemap'])
      {
        var sitemapUrl = result['sitemapindex']['sitemap'][prop].loc[0];
        q.push({url: sitemapUrl, code: code, type: 'sitemap', source: source, destination: destination});
      }
    }

    if(result.hasOwnProperty('urlset'))
    {
        for(var prop in result['urlset']['url'])
        {
          var testurl = result['urlset']['url'][prop].loc[0];
          q.push({url: testurl, code: code, type: 'url', source: source, destination: destination});
        }
    }

    callback();
    return;

  });
}

function validateSitemap(task, callback){
  request.get({url: task.url, followRedirect: false, timeout: 30000}, function(error, resp, body){
    if(error) {
      console.log('Bad URL, ' + task.url);
      callback();
      return;
    }

    if(resp.statusCode != task.code) {
      console.log(resp.statusCode + "," + task.url);
      callback();
      return;
    }

    parseString(body, function(err, result){
      if(err){
        console.log('Bad sitemap data, ' + url);
        callback();
        return;
      }

      if(result.hasOwnProperty('sitemapindex'))
      {
        for(var prop in result['sitemapindex']['sitemap'])
        {
          var sitemapUrl = result['sitemapindex']['sitemap'][prop].loc[0];
          q.push({url: sitemapUrl, code: task.code, type: 'sitemap', source: task.source, destination: task.destination});
        }
      }

      if(result.hasOwnProperty('urlset'))
      {
          for(var prop in result['urlset']['url'])
          {
            var testurl = result['urlset']['url'][prop].loc[0];
            q.push({url: testurl, code: task.code, type: 'url', source: task.source, destination: task.destination});
          }
      }

      callback();
      return;
    });
  });

}

function validateUrl(task, callback){

  // replace the url if possible
  var replacedUrl = task.url.replace(task.source, task.destination);

  request.get({url: replacedUrl, followRedirect: false, timeout: 30000}, function(error, resp, body){
    if(error) {
      console.log('Bad URL, ' + task.url);
      callback();
      return;
    }

    if(resp.statusCode != task.code) {
      console.log(resp.statusCode + "," + task.url);
    }

    callback();
  });
}
