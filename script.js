var form = document.getElementById('username-form')

var redditUrlTemplate = 'https://www.reddit.com/user/{{USER}}/comments.json?sort=new&jsonp=gotComments&limit=100'
var imgurUrlTemplate = 'https://api.imgur.com/3/account/{{USER}}/comments'

var storage = {}
var commonWords = 'i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,im,youre,hes,shes,its,were,theyre,ive,youve,weve,theyve,id,youd,hed,shed,wed,theyd,ill,youll,hell,shell,well,theyll,isnt,arent,wasnt,werent,hasnt,havent,hadnt,doesnt,dont,didnt,wont,wouldnt,shant,shouldnt,cant,cannot,couldnt,mustnt,lets,thats,whos,whats,heres,theres,whens,wheres,whys,hows,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall'.split(',')

var fill = d3.scale.category20b()
var fontSize = d3.scale.log().range([24, 96])

var w = window.innerWidth
var h = window.innerHeight - 50

function buildCloudFromComments(comments) {
  var locations = {}
  var words = comments.reduce(function(words, comment) {
    comment.text
      .toLowerCase()
      .replace(/[']/g, '')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .split(' ')
      .forEach(function(word) {
        if (commonWords.indexOf(word) >= 0) return true
        if (word.length <= 1) return true

        // Increase the count for the word, and add the locations
        if (word in words) {
          words[word].count += 1
          words[word].locations.push(comment.link)
        } else {
          words[word] = {
            count: 1,
            locations: [comment.link]
          }
        }
      })

    return words
  }, {})

  // Save the URLs and all that for later access
  storage = words

  var objs = []

  for (var word in words) {
    objs.push({
      text: word,
      size: fontSize(words[word].count)
    })
  }

  objs.sort(function(a, b) {
    if (a.size > b.size) return -1
    else if (a.size < b.size) return 1
    return 0
  })

  d3.layout.cloud().size([w, h])
    .words(objs)
    .padding(5)
    .rotate(function() {
      return ~~(Math.random() * 2) * 90
    })
    .font('Impact')
    .fontSize(function(d) {
      return d.size
    })
    .on('end', draw)
    .start()
}

function gotComments(data) {
  buildCloudFromComments(data.data.children.map(function(comment) {
    var permalink = [
      'http://www.reddit.com/r/',
      comment.data.subreddit,
      '/comments/',
      comment.data.link_id.substr(3),
      '/',
      _.snakeCase(comment.data.link_title),
      '/',
      comment.data.name.substr(3)
    ].join('')

    return {
      text: comment.data.body,
      link: {
        rank: comment.data.score,
        url: permalink
      }
    }
  }))
}

function draw(words) {
  d3.select('body').append('svg')
    .attr('width', w)
    .attr('height', h)
  .append('g')
    .attr('transform', 'translate(' + [w >> 1, h >> 1] + ')')
  .selectAll('text')
    .data(words)
  .enter().append('text')
    .style('font-size', function(d) {
      return d.size + 'px'
    })
    .style('font-family', 'Impact')
    .style('fill', function(d, i) {
      return fill(i)
    })
    .attr('text-anchor', 'middle')
    .attr('transform', function(d) {
      return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')'
    })
    .text(function(d) {
      return d.text
    })
  .on('click', function(e) {
    var clicked = e.text

    var link = _.chain(storage[clicked].locations)
      .unique(false, 'url')
      .sortByOrder(['rank'], [false])
      .first()
      .value()

    window.open(link.url)
  })
}

function jsonp(url) {
  // Use JSONP to get the next page
  var script = document.createElement('script')

  script.src = url
  script.async = true

  document.body.appendChild(script)

  script.onload = function() {
    script.parentElement.removeChild(script)
  }
}

function ajax(url) {
  var xhr = new XMLHttpRequest()

  xhr.open('GET', url, true)
  xhr.setRequestHeader('Authorization', 'Client-ID ' + imgurClientId)
  xhr.onload = function() {
    var content = this.responseText
    var json = JSON.parse(content)

    buildCloudFromComments(json.data.map(function(comment) {
      var permalink = [
        'http://imgur.com/gallery/',
        comment.image_id,
        '/comment/',
        comment.id
      ].join('')

      return {
        text: comment.comment,
        link: {
          rank: comment.points,
          url: permalink
        }
      }
    }))
  }
  xhr.send()
}

document.getElementById('go-reddit').onclick = function(e) {
  e.preventDefault()

  // If they didn't enter a username, don't bother
  if (form['username-field'].value.length < 1) return alert('Please enter a username!')

  // Remove previous cloud
  d3.selectAll('svg').remove()

  // Load up the comments
  jsonp(redditUrlTemplate.replace('{{USER}}', form['username-field'].value))
}

document.getElementById('go-imgur').onclick = function(e) {
  e.preventDefault()

  // If they didn't enter a username, don't bother
  if (form['username-field'].value.length < 1) return alert('Please enter a username!')

  // Remove previous cloud
  d3.selectAll('svg').remove()

  // Load up the comments
  ajax(imgurUrlTemplate.replace('{{USER}}', form['username-field'].value))
}

form['username-field'].focus()

// Disable the imgur button if the imgurClientId is not set
if (typeof imgurClientId !== 'string') document.getElementById('go-imgur').disabled = true
