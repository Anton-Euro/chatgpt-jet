jQuery(document).ready(function() {
    jQuery.ajax({
        type: 'GET',
        url:'/api/check_pass',
        headers: {
            'password': jQuery.cookie('password')
        },
        success: function(response) {
            if(response == false) {
                jQuery('body').html(`
<div style='margin-left: auto; margin-right: auto; margin-top: 30vh;'>
    <h2 style='text-align: center;'>ChatGPT</h2>
    <label for="password" class="form-label">Password</label>
    <input type="password" style='background-color: #292A33;' class="form-control" id="password"><br>
    <button type="submit" id='submit_pass' class="btn btn-primary">Confirm</button>
</div>
                `);
                jQuery('#submit_pass').on('click', function() {
                    jQuery.cookie('password',jQuery('#password').val());
                    jQuery.ajax({
                        type: 'GET',
                        url:'/api/check_pass',
                        headers: {
                            'password': jQuery.cookie('password')
                        },
                        success: function(response) {
                            if(response == true) {
                                location.reload();
                            }
                        },
                        error: function(_) {},
                    });
                });
            }
        },
        error: function(_) {},
    });

    let current_chat_id = '';
    let last_pos = false;
    let lastScrollTop = 0;

    jQuery.ajax({
        type: 'GET',
        url:'/api/models',
        success: function(response) {
            for(let i = 0; i < response.length; i++) {
                jQuery('.model_list').append(new Option(response[i]));
            }
        },
        error: function(_) {},
    });

    jQuery.ajax({
        type: 'GET',
        url:'/api/version',
        success: function(response) {
            jQuery('.settings-body').append(`<br><span>g4f version: ${response}</span>`);
        },
        error: function(_) {},
    });
    

    jQuery.ajax({
        type: 'GET',
        url:'/api/current_settings',
        headers: {
            'password': jQuery.cookie('password')
        },
        success: function(response) {
            jQuery('.model_list').val(response['model']);
            if(response['web_search'] == 1) {
                jQuery('#web_search_chackbox').prop('checked', true);
                jQuery('#web_search_chackbox_mobile').prop('checked', true);
            }
            if(response['generated_title'] == 1) {
                jQuery('#generated_title_chackbox').prop('checked', true);
                jQuery('#generated_title_chackbox_mobile').prop('checked', true);
            }
            get_provider(response['model'],response['provider']);
        },
        error: function(_) {},
    });

    jQuery('.model_list').on('change', function() {
        jQuery('.model_list').val(jQuery(this).val());
        get_provider(jQuery(this).val(), 'none');
    });
    jQuery('.provider_list').on('change', function() {
        jQuery('.provider_list').val(jQuery(this).val());
    });
    jQuery('#web_search_chackbox').on('change', function() {
        if(jQuery('#web_search_chackbox').is(':checked')) {
            jQuery('#web_search_chackbox_mobile').prop('checked', true);
        } else {
            jQuery('#web_search_chackbox_mobile').prop('checked', false);
        }
    });
    jQuery('#web_search_chackbox_mobile').on('change', function() {
        if(jQuery('#web_search_chackbox_mobile').is(':checked')) {
            jQuery('#web_search_chackbox').prop('checked', true);
        } else {
            jQuery('#web_search_chackbox').prop('checked', false);
        }
    });
    jQuery('#generated_title_chackbox').on('change', function() {
        if(jQuery('#generated_title_chackbox').is(':checked')) {
            jQuery('#generated_title_chackbox_mobile').prop('checked', true);
        } else {
            jQuery('#generated_title_chackbox_mobile').prop('checked', false);
        }
    });
    jQuery('#generated_title_chackbox_mobile').on('change', function() {
        if(jQuery('#generated_title_chackbox_mobile').is(':checked')) {
            jQuery('#generated_title_chackbox').prop('checked', true);
        } else {
            jQuery('#generated_title_chackbox').prop('checked', false);
        }
    });
    
    if(jQuery('.chat_list').css('display') != 'none') {
        jQuery('.main').width(jQuery(window).width() - 260);
        jQuery('.user_chats').css('height', jQuery(window).height() - jQuery('#settings_butt').height() - jQuery('.new_chat').height() - 50);
    } else {
        jQuery('.main').width(jQuery(window).width());
        jQuery('.user_chats').css('height', jQuery(window).height() - jQuery('#settings_butt').height() - jQuery('.new_chat').height() - jQuery('.offcanvas-header').height() - 80);
    }
    
    jQuery('.main_window').css('height', jQuery(window).height() - jQuery('#prompt').height() - jQuery('#image_area').height() - 30);
    

    jQuery(window).on('resize', function() {
        if(jQuery('.chat_list').css('display') != 'none') {
            jQuery('.main').width(jQuery(window).width() - 260);
            jQuery('.user_chats').css('height', jQuery(window).height() - jQuery('#settings_butt').height() - jQuery('.new_chat').height() - 50);
        } else {
            jQuery('.main').width(jQuery(window).width());
            jQuery('.user_chats').css('height', jQuery(window).height() - jQuery('#settings_butt').height() - jQuery('.new_chat').height() - jQuery('.offcanvas-header').height() - 80);
    
        }
        jQuery('.main_window').css('height', jQuery(window).height() - jQuery('#prompt').height() - jQuery('#image_area').height() - 30);
    });

    const md = window.markdownit({
        breaks: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
              try {
                return `<pre><div id='code_title'><span>${lang}</span><button class='copy_code'><svg class="copy_code_svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/></svg><svg class="confirm_copy_code_svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg><span class='copy_butt_text'>Copy code</span></button></div><code class="hljs language-${lang}">` +
                       hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                       '</code><div class="code_all_text" style="display: none">' + str + '</div></pre>';
              } catch (__) {}
            }
        
            return `<pre><div id='code_title'><span>text</span><button class='copy_code'><svg class="copy_code_svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/></svg><svg class="confirm_copy_code_svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg><span class='copy_butt_text'>Copy code</span></button></div><code class="hljs language-text">` + md.utils.escapeHtml(str) + '</code><div class="code_all_text" style="display: none">' + str + '</div></pre></pre>';
          }
        }).use(texmath, { engine: katex,
            delimiters: ['dollars','brackets'],
            katexOptions: { macros: {"\\RR": "\\mathbb{R}"} } } );;

    function add_message(user, message, cursor) {
        let cur = '';
        let result = '';
        if(cursor == true) {
            cur = '<div class="cursor_text"></div>';
        }
        if(user == 'user') {
            result = message.replace(/\n/g,'<br>');
            if(message.includes('![](data:image/png;base64,')) {
                result = result.replace(/!\[\]\(([^)]+)\)/g, '<img src="$1" alt="">');
            }
        } else {
            result = md.render(message);
        }
        jQuery('.main_window').append(`
            <div class="message" mess_user='${user}'>
                <div class="message_user"><strong>${user}</strong></div>
                <div class="message_text">${result}</div>${cur}
                <div class='un_render_text' style='display: none;'>${message}</div>
                <button class='clipboard_butt'>
                <div class="copy_svg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-clipboard" viewBox="0 0 16 16">
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                    </svg>
                </div>
                <div class="confirm_copy_svg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-check" viewBox="0 0 16 16">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    </svg>
                </div>
                </button><button style='border: none;background-color: transparent;'></button>
            </div>
        `);
        jQuery('.main_window').scrollTop(jQuery('.main_window')[0].scrollHeight);
        last_pos = true;
        // MathJax.typesetPromise([document.getElementsByClassName('message')]);
    }

    jQuery('.main_window').on('scroll', function() {
        let st = jQuery(this).scrollTop();
        if(st < lastScrollTop){
            last_pos = false;
        }
        lastScrollTop = st;
        if(jQuery(this)[0].clientHeight + jQuery(this).scrollTop() == jQuery(this)[0].scrollHeight) {
            last_pos = true;
        }
    });

    function chat_req(message, chat_id, model, provider, img_data, image_base64, web_search, generated_title, first_mess) {
        if(img_data != undefined) {
            add_message('user', `![](${image_base64})\n`+message, false);
        } else {
            add_message('user', message, false);
        }
        let textContainer = jQuery('.main_window');
        const formData = new FormData();
        formData.append('chat_id', chat_id);
        formData.append('message', message);
        formData.append('model', model);
        formData.append('provider', provider);
        formData.append('web_search', web_search);
        formData.append('image_base64', image_base64);
        if(img_data != undefined) {
            formData.append('image', img_data);
        }
        let request_send = jQuery.ajax({
            type: 'POST',
            url:'/api/req',
            headers: {
                'password': jQuery.cookie('password')
            },
            data: formData,
            beforeSend: function() {
                add_message('assistant', '', true);
            },
            success: function(_) {
                jQuery("#send").css('display', 'inline');
                jQuery('#stop_send').css('display', 'none');
                jQuery('.cursor_text').remove();
                if(last_pos == true) {
                    jQuery('.main_window').scrollTop(jQuery('.main_window')[0].scrollHeight);
                }
            },
            complete: function(_) {
                const formData = new FormData();
                formData.append('chat_id', chat_id);
                formData.append('generate', generated_title);
                if(jQuery('#web_search_chackbox').is(':checked')) {
                    formData.append('message', jQuery('.main_window .message:last .un_render_text').text());
                } else {
                    formData.append('message', message);
                }
                if(first_mess == true) {
                    jQuery.ajax({
                        type: 'POST',
                        url:'/api/create_title',
                        headers: {
                            'password': jQuery.cookie('password')
                        },
                        data: formData,
                        success: function(response) {
                            function animateText(element, text, index) {
                                if (index < text.length) {
                                    element.append(text[index]);
                                    index++;
                                    setTimeout(function () {
                                        animateText(title_el, response, index);
                                    }, 50);
                                }
                            }
                            let title_el = jQuery('.chat[chat_id="' + current_chat_id + '"] .chat_title');
                            title_el.empty();
                            animateText(title_el, response, 0);
                        },
                        processData: false,
                        contentType: false,
                        error: function(_) {},
                    });
                }
            },
            error: function(_) {},
            xhrFields: {
                onprogress: function(e) {
                    var response = e.currentTarget.response;
                    let result = md.render(response);
                    jQuery('.main_window .message:last .message_text').html(result);
                    jQuery('.main_window .message:last .un_render_text').html(response);
                    // MathJax.typesetPromise([document.getElementsByClassName('message')]);
                    if(last_pos == true) {
                        jQuery('.main_window').scrollTop(jQuery('.main_window')[0].scrollHeight);
                    }
                }
            },
            processData: false, 
            contentType: false
        });
        jQuery('#stop_send').on('click', function() {
            request_send.abort();
            jQuery("#send").css('display', 'inline');
            jQuery('#stop_send').css('display', 'none');
            jQuery('.main_window').scrollTop(jQuery('.main_window')[0].scrollHeight);
            jQuery('.cursor_text').remove();
            const formData = new FormData();
            formData.append('chat_id', chat_id);
            formData.append('generate', generated_title);
            formData.append('message', message);
            jQuery.ajax({
                type: 'POST',
                url:'/api/create_title',
                headers: {
                    'password': jQuery.cookie('password')
                },
                data: formData,
                success: function(response) {
                    function animateText(element, text, index) {
                        if (index < text.length) {
                            element.append(text[index]);
                            index++;
                            setTimeout(function () {
                                animateText(title_el, response, index);
                            }, 50);
                        }
                    }
                    let title_el = jQuery('.chat[chat_id="' + current_chat_id + '"] .chat_title');
                    title_el.empty();
                    animateText(title_el, response, 0);
                },
                processData: false,
                contentType: false,
                error: function(_) {},
            });
        });
    }

    function get_provider(model,provider) {
        jQuery('.provider_list').empty();
        jQuery.ajax({
            type: 'GET',
            url:'/api/get_best_providers',
            data: {'model': model},
            success: function(response) {
                jQuery('.provider_list').append(new Option('default'));
                for(let i = 0; i < response.length; i++) {
                    let prov = new Option(response[i][0]);
                    jQuery('.provider_list').append(prov);
                    if(response[i][1] === true) {
                        jQuery(prov).css({'color':'green'});
                    } else {
                        jQuery(prov).css({'color':'red'});
                    }
                    
                }
                if(provider == 'none') {
                    jQuery('.provider_list').val('default');
                } else {
                    jQuery('.provider_list').val(provider);
                }
                if(jQuery('.provider_list').val() != 'Bing') {
                    jQuery('#image_send').css('display', 'none');
                }
                
            },
            error: function(_) {},
        });
    }

    jQuery.ajax({
        type: 'GET',
        url:'/api/chats',
        headers: {
            'password': jQuery.cookie('password')
        },
        success: function(response) {
            jQuery('.loader').css('display', 'none');
            for(let i = 0; i < response['length']; i++) {
                jQuery('.user_chats').append(`
            <div class="chat" chat_id='${response[i]['chat_id']}'>
                <span class="chat_title"></span>
                <button class="delete_mess">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>
                <div class="confirm_delete">
                    <button class="confirm_del">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" class="bi bi-check" viewBox="0 0 16 16">
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                        </svg>
                    </button>
                    <button class="cencel_del">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" class="bi bi-x" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                          </svg>
                    </button>
                </div>
            </div>
                `);
                jQuery('.user_chats .chat:last .chat_title').text(response[i]['title']);
                jQuery('.chat_list_mobile .user_chats .chat:last .chat_title').text(response[i]['title']);
            }
            
        },
        error: function(_) {},
    });

    jQuery('#upload_image_file').change(function() {
        var reader = new FileReader();

        reader.onload = function(e) {
            let s = e.target.result;
            jQuery('#image_area').html(`
            <img id='title_img' src="${s.substring(0, s.indexOf('/') + 1) + 'png' + s.substring(s.indexOf(';'))}" alt="">
            <button class="delete_image">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-trash-fill" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                </svg>
            </button>
            `);
            jQuery('.main_window').css('height', jQuery(window).height() - jQuery('#next_area').height() - jQuery('#image_area').height() - 30);
        };

        reader.readAsDataURL(this.files[0]);
    });

    jQuery('.input_window').on('mouseenter', '#image_area', function() {
        jQuery('.delete_image').css('display','inline');
    });

    jQuery('.input_window').on('mouseleave', '#image_area', function() {
        jQuery('.delete_image').css('display','none');
    });

    jQuery('.input_window').on('click', '.delete_image', function() {
        jQuery('#upload_image_file').val(null);
        jQuery('#image_area').empty();
        jQuery('.main_window').css('height', jQuery(window).height() - this.scrollHeight - jQuery('#image_area').height() - 30);
    });

    jQuery('.main_window').on('mouseenter', '.message', function() {
        if(jQuery(this).find('.cursor_text').length == 0) {
            jQuery(this).find('.clipboard_butt').css('display','inline');
        }
    });

    jQuery('.main_window').on('mouseleave', '.message', function() {
        jQuery(this).find('.clipboard_butt').css('display','none');
    });

    

    jQuery('.main_window').on('click', '.copy_code', function() {
        navigator.clipboard.writeText(jQuery(this).parent().parent().find('.code_all_text').text());
        let copy_svg = jQuery(this).find('.copy_code_svg');
        let conf_svg = jQuery(this).find('.confirm_copy_code_svg');
        let copy_butt = jQuery(this).find('.copy_butt_text');
        copy_butt.html('Copied!');
        copy_svg.css('display','none');
        conf_svg.css('display','inline');
        setTimeout(function() {
            copy_svg.css('display','inline');
            conf_svg.css('display','none');
            copy_butt.html('Copy code');
        }, 3000);
    });

    jQuery('.main_window').on('click', '.clipboard_butt', function() {
        navigator.clipboard.writeText(jQuery(this).parent().find('.un_render_text').text());
        let copy_svg = jQuery(this).find('.copy_svg');
        let conf_svg = jQuery(this).find('.confirm_copy_svg');
        copy_svg.css('display','none');
        conf_svg.css('display','inline');
        setTimeout(function() {
            copy_svg.css('display','inline');
            conf_svg.css('display','none');
        }, 1000);
    });

    jQuery('#prompt').keypress(function(event) {
        if(jQuery('.chat_list').css('display') != 'none') {
            if(event.which === 13) {
                if(!event.shiftKey) {
                    event.preventDefault();
                    if(jQuery('#stop_send').css('display') == 'none') {
                        jQuery('#send').click();
                    }
                }
            }
        }
    });

      jQuery('#prompt').on('input', function(event) {
        if(this.scrollHeight > 72) {
            if(this.scrollHeight < 300) {
                jQuery('.main_window').css('height', jQuery(window).height() - this.scrollHeight - jQuery('#image_area').height() - 30);
                jQuery(this).css('overflow', 'hidden');
                jQuery(this).css('height', 'auto');
                jQuery(this).css('height', this.scrollHeight + 'px');
            } else {
                jQuery('.main_window').css('height', jQuery(window).height() - 300 - jQuery('#image_area').height() - 30);
                jQuery(this).css('height', 'auto');
                jQuery(this).css('height', '300px');
                jQuery(this).scrollTop(jQuery(this)[0].scrollHeight);
                jQuery(this).css('overflow', 'auto');

            }
        } else {
            jQuery(this).css('height', '50px');
            jQuery('.main_window').css('height', jQuery(window).height() - this.scrollHeight - jQuery('#image_area').height() - 30);
        }
        if(jQuery(this).val().trim() == '') {
            jQuery("#send").prop('disabled', true);
            jQuery("#send").css('opacity','0.5');
        } else {
            if(jQuery('#stop_send').css('display') == 'none') {
                jQuery("#send").prop('disabled', false);
                jQuery("#send").css('opacity','1.0');
            }
        }
        if(event.originalEvent.inputType === 'deleteContentBackward' || event.originalEvent.inputType === 'deleteByCut') {
            if(jQuery('#prompt').val().trim() == '') {
                jQuery('#prompt').css('height', '50px');
                jQuery('.main_window').css('height', jQuery(window).height() - this.scrollHeight - jQuery('#image_area').height() - 30);
            }
        }
    });

    jQuery('.new_chat').on('click', function() {
        jQuery('.main_window').empty();
        jQuery('.chat[chat_id="' + current_chat_id + '"]').removeClass('current_chat');
        current_chat_id = '';
        jQuery('.main_window').html('<h1 style="text-align: center; padding: 20%;">How can I help you today?</h1>');
        if(jQuery('.chat_list').css('display') == 'none') {
            jQuery('#mibile_menu_close').click();
        }
    });

    jQuery(".user_chats").on("click", ".delete_mess", function () {
        let chat_id = jQuery(this).parent().attr('chat_id');
        jQuery(this).css('display','none');
        jQuery('.chat[chat_id="' + chat_id + '"] .confirm_delete').css('display','flex');
    });

    jQuery(".user_chats").on("click", ".cencel_del", function () {
        let chat_id = jQuery(this).parent().parent().attr('chat_id');
        jQuery(this).parent().css('display','none');
        jQuery('.chat[chat_id="' + chat_id + '"] .delete_mess').css('display','flex');
    });

    jQuery(".user_chats").on("click", ".confirm_del", function () {
        let chat_id = jQuery(this).parent().parent().attr('chat_id');
        jQuery('.chat[chat_id="' + chat_id + '"]').remove();
        jQuery.ajax({
            type: 'GET',
            url:'/api/delete',
            headers: {
                'password': jQuery.cookie('password')
            },
            data: {'chat_id': chat_id},
            success: function(_) {
                jQuery('.main_window').empty();
                jQuery('.new_chat').click();
            },
            error: function(_) {},
        });
    });

    jQuery('.user_chats').on('click', '.chat', function() {
        let chat_id = jQuery(this).attr('chat_id');
        if(current_chat_id == '' || current_chat_id != chat_id) {
            if(current_chat_id != '') {
                jQuery('.chat[chat_id="' + current_chat_id + '"]').removeClass('current_chat');
            }
            current_chat_id = chat_id;
            jQuery(this).addClass('current_chat');
            jQuery('.main_window').empty();
            jQuery.ajax({
                type: 'GET',
                url:'/api/history',
                headers: {
                    'password': jQuery.cookie('password')
                },
                data: {'chat_id': chat_id},
                success: function(response) {
                    for(let i = 0; i < response['length']; i++) {
                        add_message(response[i]['role'], response[i]['content'], false);
                    }
                },
                error: function(_) {},
            });
            if(jQuery('.chat_list').css('display') == 'none') {
                jQuery('#mibile_menu_close').click();
            }
        }
    });

    jQuery('#send').on('click', function() {
        let message = jQuery('#prompt').val();
        if(message.trim() == '') {
            return;
        }
        let img_data = jQuery('#upload_image_file')[0].files[0];
        let image_base64 = jQuery('#title_img').attr('src');
        let model = jQuery('.model_list').val();
        let provider = jQuery('.provider_list').val();
        jQuery('#prompt').val('');
        jQuery('#prompt').css('height', '50px');
        jQuery('#upload_image_file').val(null);
        jQuery('#image_area').empty();
        jQuery('.main_window').css('height', jQuery(window).height() - jQuery('#next_area').height() - jQuery('#image_area').height() - 30);
        jQuery("#send").css('display', 'none');
        jQuery("#send").css('opacity','0.5');
        jQuery('#stop_send').css('display', 'inline');
        if(current_chat_id == '') {
            jQuery('.main_window').empty();
            jQuery.ajax({
                type: 'GET',
                url:'/api/create',
                headers: {
                    'password': jQuery.cookie('password')
                },
                success: function(response) {
                    current_chat_id = response['chat_id'];
                    jQuery('.user_chats').prepend(`
            <div class="chat" chat_id='${current_chat_id}'>
                <span class="chat_title">New Chat</span>
                <button class="delete_mess">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>
                <div class="confirm_delete">
                    <button class="confirm_del">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" class="bi bi-check" viewBox="0 0 16 16">
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                        </svg>
                    </button>
                    <button class="cencel_del">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" class="bi bi-x" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                          </svg>
                    </button>
                </div>
            </div>
                    `);
                    jQuery('.chat[chat_id="' + current_chat_id + '"]').addClass('current_chat');
                    chat_req(message, current_chat_id, model, provider, img_data, image_base64, jQuery('#web_search_chackbox').is(':checked'), jQuery('#generated_title_chackbox').is(':checked'), true);
                },
                error: function(_) {},
            });
        } else {
            chat_req(message, current_chat_id, model, provider, img_data, image_base64, jQuery('#web_search_chackbox').is(':checked'), jQuery('#generated_title_chackbox').is(':checked'), false);
        }
    });

    jQuery('#save_desk_sett, #save_mobile_sett').on('click', function() {
        jQuery.ajax({
            type: 'GET',
            url:'/api/save_settings',
            headers: {
                'password': jQuery.cookie('password')
            },
            data: {'model': jQuery('.model_list').val(), 'provider': jQuery('.provider_list').val(), 'web_search': 1 ? jQuery('#web_search_chackbox').is(':checked') : 0, 'generated_title': 1 ? jQuery('#generated_title_chackbox').is(':checked') : 0},
            success: function(_) {},
            error: function(_) {},
        });
        if(jQuery('.provider_list').val() == 'Bing' || jQuery('.model_list').val() == 'gemini' || jQuery('.model_list').val() == 'gemini-pro') {
            jQuery('#image_send').css('display', 'inline');
        } else {
            jQuery('#image_send').css('display', 'none');
        }
    });

});