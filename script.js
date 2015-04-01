var form = document.getElementById('username-form')

var urlTemplate = 'http://www.reddit.com/user/{{USER}}/comments.json?sort=new&jsonp=gotComments&limit=100'
var commonWords = 'i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,im,youre,hes,shes,its,were,theyre,ive,youve,weve,theyve,id,youd,hed,shed,wed,theyd,ill,youll,hell,shell,well,theyll,isnt,arent,wasnt,werent,hasnt,havent,hadnt,doesnt,dont,didnt,wont,wouldnt,shant,shouldnt,cant,cannot,couldnt,mustnt,lets,thats,whos,whats,heres,theres,whens,wheres,whys,hows,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall'.split(',')

var fill = d3.scale.category20b()
var fontSize = d3.scale.log().range([24, 96])

var w = window.innerWidth
var h = window.innerHeight - 50

function gotComments(data) {
  var words = data.data.children.reduce(function(words, comment) {
    comment.data.body
      .toLowerCase()
      .replace(/[']/g, '')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .split(' ')
      .forEach(function(word) {
        if (commonWords.indexOf(word) < 0) {
          if (word.length > 1) {
            if (word in words) words[word] += 1
            else words[word] = 1
          }
        }
      })

    return words
  }, {})

  var objs = []

  for (var word in words) {
    objs.push({
      text: word,
      size: fontSize(words[word])
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
}

function jsonp(url) {
  // Use JSONP to get the next page
  var script = document.createElement('script')

  script.src = url
  script.async = true

  document.body.appendChild(script)
}

form.onsubmit = function(e) {
  e.preventDefault()

  // Remove previous cloud
  d3.selectAll('svg').remove()

  // Load up the comments
  jsonp(urlTemplate.replace('{{USER}}', this['username-field'].value))

  return false
}

form['username-field'].focus()
