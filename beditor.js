/**
 * jQuery
 * author bobo
 * version 0.0.1
 * date 2016.11.19
 */
(function($) {
  $.fn.beditor = function(options) {

    var $document = $(document)

    // 默认配置
    var settings = $.extend({
      markdown: true, // markdown 功能开启
      toolbar: true // 工具栏开启
    }, options)

    return this.each(function() {
      var $this = $(this)

      $this.attr('contentEditable', true)
      $this.addClass('beditor')

      // 初始化
      init()

      // 实现输入 markdown
      $this.on('keydown', function(e) {
        if (!settings.markdown) {
          return
        }
        if (e.keyCode === 9 || e.keyCode === 32) {

          var selection = window.getSelection()
          var range = selection.getRangeAt(0)
          var node = range.startContainer.parentNode
          var parentText = range.endContainer.parentNode.innerText
          var preText = parentText.substr(0, range.endOffset)
          var content = parentText.substr(range.endOffset)
          var newNode
          var toDeal = true

          if (preText === '#') {
            newNode = document.createElement("h1")
          } else if (preText === '##') {
            newNode = document.createElement("h2")
          } else if (preText === '###') {
            newNode = document.createElement("h3")
          } else if (preText.match(/(.*?)[^!]\[(.+?)\]\((.+?)\)/) || preText.match(/^\[(.+?)\]\((.+?)\)/)) {
            var imgNode = document.createElement('a')
            var imgPreText
            newNode = document.createElement('div')
            content = document.createElement('div')

            preText.replace(/(.*?)\[(.+?)\]\((.+?)\)/, function() {
              imgPreText = document.createTextNode(arguments[1])
              console.log(arguments)
              imgNode.innerText = arguments[2]
              imgNode.href = arguments[3]
              return '<a href = "' + arguments[3] + '">' + arguments[2] + '</a>'
            })

            content.appendChild(imgPreText)
            content.appendChild(imgNode)
            console.log(content)
          } else if (preText.match(/(.*?)!\[(.+?)\]\((.+?)\)/)) {
            var imgNode = document.createElement('img')
            var imgPreText
            newNode = document.createElement('div')
            content = document.createElement('div')

            preText.replace(/(.*?)!\[(.+?)\]\((.+?)\)/, function() {
              imgPreText = document.createTextNode(arguments[1])
              console.log(arguments)
              imgNode.alt = arguments[2]
              imgNode.src = arguments[3]
              return '<img src = "' + arguments[3] + 'alt =' + arguments[2] + ' />'
            })

            content.appendChild(imgPreText)
            content.appendChild(imgNode)
            console.log(content)

          } else {
            toDeal = false
          }

          if (toDeal) {
            e.preventDefault()
            var now = Date.now()
            var textNode = content || document.createTextNode("\u00a0")


            newNode.id = now
            range.selectNode(node)
            range.surroundContents(newNode)
            node.replaceWith(textNode) // 选中元素不能为空
            range.selectNode(newNode)

            range.setStart(newNode, 0)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
            newNode.focus()

            if (!content) document.execCommand('delete', false, null)

            range.detach()
            return false;
          }

        }
      })

      // 获取选中文字
      $document.on('mouseup', '.beditor', function() {
        var selection = window.getSelection()
        var range = selection.getRangeAt(0)
        var text = range.toString()

        if (text.length > 0) {
          showToolbar()
        } else {
          if (!$document.find('.b_toolbar').is(':hidden')) closeToolbar()
        }
      })

    })

    // 出现弹窗
    function showToolbar() {
      if (!settings.toolbar) {
        return
      }

      var coords = getSelectionCoords()
      var wholeWith = $document.find('.beditor').width()
      var x = wholeWith - coords.x > 200 ? coords.x : wholeWith - 200
      var y = coords.y > 80 ? coords.y - 40 : coords.y + 40
      openToolbar(x, y)
    }

    // 初始化
    function init() {
      // 工具栏点击
      listenToolbarAction()
      // 悬浮输入弹窗
      listenInput()
      // 监听工具栏快捷键
      callToolbar()
    }

    // 调出工具栏 Ctrl + i
    function callToolbar() {
      $document.on('keydown', '.beditor', function(e) {
        if (e.keyCode === 73 && e.ctrlKey) {
          showToolbar()
        }
      })
    }

    // 获得选中字符串位置
    function getSelectionCoords(win) {
      win = win || window;
      var doc = win.document;
      var sel = doc.selection, range, rects, rect;
      var x = 0, y = 0;
      if (sel) {
          if (sel.type != "Control") {
              range = sel.createRange();
              range.collapse(true);
              x = range.boundingLeft;
              y = range.boundingTop;
          }
      } else if (win.getSelection) {
          sel = win.getSelection();
          if (sel.rangeCount) {
              range = sel.getRangeAt(0).cloneRange();
              if (range.getClientRects) {
                  range.collapse(true);
                  rects = range.getClientRects();
                  console.log(rects)
                  if (rects.length > 0) {
                      rect = rects[0];
                      x = rect.left;
                      y = rect.top;
                  }
              }
              // Fall back to inserting a temporary element
              if (x == 0 && y == 0) {
                  var span = doc.createElement("span");
                  if (span.getClientRects) {
                      // Ensure span has dimensions and position by
                      // adding a zero-width space character
                      span.appendChild( doc.createTextNode("\u200b") );
                      range.insertNode(span);
                      rect = span.getClientRects()[0];
                      x = rect.left;
                      y = rect.top;
                      var spanParent = span.parentNode;
                      spanParent.removeChild(span);

                      // Glue any broken text nodes back together
                      spanParent.normalize();
                  }
              }
          }
      }
      return { x: x, y: y };
  }

  // 工具栏弹窗
  function openToolbar(x, y) {
    var b_toolbar = $(
    '<div class="b_toolbar">' +
      '<span name="b_set_blod">B</span>' +
      '<span name="b_set_del">—</span>' +
      '<span name="b_set_h1">H1</span>' +
      '<span name="b_set_h2">H2</span>' +
      '<span name="b_set_li">Li</span>' +
      '<span name="b_set_link">Link</span>' +
      '<span name="b_set_pic">Pic</span>' +
    '</div>')

    if ($(document).find('.b_toolbar').length === 0) {
      b_toolbar.css('left', x).css('top', y)

      $('body').append(b_toolbar)
    } else {
      $('.b_toolbar').css('left', x).css('top', y).fadeIn()
    }

  }

  function closeToolbar() {
    $(document).find('.b_toolbar').fadeOut()
  }

  function listenToolbarAction() {
    $document.on('click', '.b_toolbar span', function(e) {

      e.stopPropagation()

      var action = $(this).attr('name')

      switch (action) {
        case 'b_set_blod':
          document.execCommand('Bold', false, null)
          break;
        case 'b_set_del':
          document.execCommand('strikeThrough', false, null)
          break;
        case 'b_set_h1':
          document.execCommand('formatBlock', false, '<h1>')
          break;
        case 'b_set_h2':
          document.execCommand('formatBlock', false, 'h2')
          break;
        case 'b_set_li':
          document.execCommand('insertOrderedList', false, null)
          break;
        case 'b_set_link':
          insertUrl('link')
          break;
        case 'b_set_pic':
          insertUrl('img')
          break;
        default:
          return
      }

    })
  }

  // 输入网址弹窗
  // var savedSel
  var savedSel
  var insertType = ''
  function insertUrl(type) {
    var $b_toolbar = $('.b_toolbar')
    var x = $b_toolbar.css('left')
    var y = $b_toolbar.css('top')
    var linkInput

    insertType = type
    if (insertType === 'link') {
      linkInput = $('<input type="text" class="b_input" name="linkUrl" placeholder="请输入网址" />')
    } else if (insertType === 'img') {
      linkInput = $('<input type="text" class="b_input" name="imgUrl" placeholder="请输入图片地址" />')
    }

    savedSel = saveSelection()
    $b_toolbar.fadeOut()


    if ($('.b_input').length > 0) {
      $('.b_input').css('left', x).css('top', y)
      $('.b_input').fadeIn()
    } else {
      linkInput.css('left', x).css('top', y)
      $('body').append(linkInput)
    }

    $(linkInput).on('keydown', function(e) {
      if (e.keyCode === 13) {
        e.preventDefault()

        var val = $(this).val()

        if (val) {
          console.log(savedSel)
          restoreSelection(savedSel)
          if (insertType === 'link') {
            document.execCommand('createLink', false, val)
          } else if (insertType === 'img') {
            document.execCommand('insertImage', false, val)
          }

          $('.b_input').fadeOut().val('')
        }
      }
    })
  }

  // 失焦，退出 input 弹窗
  function listenInput() {
    var $b_input = $document.find('.b_input')

    $document.on('blur', '.b_input', function() {
      if (!$b_input.is(':hidden')) $('.b_input').fadeOut().val('')
    })

    $document.on('click', function() {
      if (!$('.b_input').is(':hidden') && !$('.b_input').is(':focus')) $('.b_input').fadeOut().val('')
    })
  }


  // 尝试解决跨区域添加标签
  function changeTag(tag) {
    tag = tag || 'h1'
    var selection = window.getSelection()
    var range = selection.getRangeAt(0).cloneRange();
    var newNode = document.createElement(tag)

    var documentFragment = range.extractContents()
    console.log(documentFragment.childNodes)
    var range2 = document.createRange()

    documentFragment.childNodes.forEach(function(item) {
      newNode.append($(item))
    })

    range2.selectNode(newNode)
    range2.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // 保存selection
  function saveSelection() {
      if (window.getSelection) {
          sel = window.getSelection();
          if (sel.getRangeAt && sel.rangeCount) {
              var ranges = [];
              for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                  ranges.push(sel.getRangeAt(i));
              }
              return ranges;
          }
      } else if (document.selection && document.selection.createRange) {
          return document.selection.createRange();
      }
      return null;
  }

  function restoreSelection(savedSel) {
      if (savedSel) {
          if (window.getSelection) {
              sel = window.getSelection();
              sel.removeAllRanges();
              for (var i = 0, len = savedSel.length; i < len; ++i) {
                  sel.addRange(savedSel[i]);
              }
          } else if (document.selection && savedSel.select) {
              savedSel.select();
          }
      }
  }

  }
})(jQuery)
