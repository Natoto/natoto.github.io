---
title: 将 Octopress 博客从 GitHub 迁移到 GitCafe
tags: []
date: 2014-11-15 13:38:20
---

在[上一篇博文](http://blog.leichunfeng.com/blog/2014/11/11/use-octopress-plus-github-pages-to-setup-a-personal-blog/)中我们提到了因为 GitHub 毕竟是国外的（你懂的）代码托管网站，所以我们博客的访问速度始终还是比较慢的。因此，如果你想让你的博客访问速度有飞一般的感觉的话，那么就跟我一样将你的 Octopress 博客从 GitHub 迁移到 GitCafe 上吧！

## 迁移原理

**注意**，这里所说的迁移并非就是要完全抛弃 GitHub ，我们不需要这么极端。而是指我们在将博客内容 `push` 到 GitHub 的时候，也顺便 `push` 一份到 GitCafe 上。然后用 GitCafe 上的那份作为我们对外的博客使用，而 GitHub 上的那份则作为备份留存。这样，当我们哪天想再用回 GitHub 的时候，只要将我们的域名重新指回 GitHub 的博客地址就可以了，反之亦然。

在开始之前，我想大概谈一谈迁移的原理，理解了原理后你可能都不需要看下面的迁移步骤，自己就能轻松搞定了。我们知道，Octopress 其实为我们建立了两个分支，`source` 分支充当书桌，`master` 分支则用于存放最终生成的 `HTML` 博文。但有一点我们需要特别注意，那就是 Octopress 对这两个分支的操作其实是在本地两个不同的 Git 仓库中进行的。其中，对 `source` 分支的操作在 `octopress` 仓库中进行，而对 `master` 分支的操作则在 `_deploy` 仓库中进行。因此，接下来我们需要做的就已经比较明确了，只需要给 `_deploy` 仓库添加一个新的 GitCafe 远程仓库，然后将博客内容顺道 `push` 一份到 GitCafe 上就 OK 了。

## 准备工作

1.  注册 [GitCafe](http://gitcafe.com/signup?invited_by=leichunfeng) 账号。
2.  添加 SSH 公钥到你的 GitCafe 账号下，可参考 GitCafe 官方帮助文档中的[《如何安装和设置 Git》](https://gitcafe.com/GitCafe/Help/wiki/%E5%A6%82%E4%BD%95%E5%AE%89%E8%A3%85%E5%92%8C%E8%AE%BE%E7%BD%AE-Git#wiki)。
3.  创建一个与你的 GitCafe 用户名相同名称的项目，例如 [leichunfeng](https://gitcafe.com/leichunfeng/leichunfeng) 。

## 添加远程仓库

运行以下命令，给 `_deploy` 仓库添加你的 GitCafe 仓库为新的远程仓库。记得先将 `git@gitcafe.com:leichunfeng/leichunfeng.git` 替换为你刚创建的 GitCafe 仓库的 SSH 地址。

<figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
<span class='line-number'>2</span>
</pre></td><td class='code'>

    <span class='line'><span class="n">cd</span> <span class="n">_deploy</span>
    </span><span class='line'><span class="n">git</span> <span class="n">remote</span> <span class="n">add</span> <span class="n">gitcafe</span> <span class="n">git</span><span class="vi">@gitcafe</span><span class="o">.</span><span class="n">com</span><span class="ss">:leichunfeng</span><span class="o">/</span><span class="n">leichunfeng</span><span class="o">.</span><span class="n">git</span>
    </span>`</pre></td></tr></table></div></figure>

    ## 修改发布脚本

    为了实现在我们将博客内容 `push` 到 GitHub 的时候，也顺便 `push` 一份到 GitCafe 上，我们需要对 Octopress 的发布脚本稍作修改。这里，我们只需要在 `Rakefile` 文件中的 `:deploy` 部分添加以下三行代码就可以了。

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    <span class='line-number'>3</span>
    <span class='line-number'>4</span>
    <span class='line-number'>5</span>
    <span class='line-number'>6</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="nb">puts</span> <span class="s2">&quot;</span><span class="se">\n</span><span class="s2">## Pushing generated </span><span class="si">#{</span><span class="n">deploy_dir</span><span class="si">}</span><span class="s2"> website&quot;</span>
    </span><span class='line'><span class="no">Bundler</span><span class="o">.</span><span class="n">with_clean_env</span> <span class="p">{</span> <span class="nb">system</span> <span class="s2">&quot;git push origin </span><span class="si">#{</span><span class="n">deploy_branch</span><span class="si">}</span><span class="s2">&quot;</span> <span class="p">}</span>
    </span><span class='line'><span class="nb">puts</span> <span class="s2">&quot;</span><span class="se">\n</span><span class="s2">## Github Pages deploy complete&quot;</span>
    </span><span class='line'><span class="nb">puts</span> <span class="s2">&quot;</span><span class="se">\n</span><span class="s2">## Pushing generated </span><span class="si">#{</span><span class="n">deploy_dir</span><span class="si">}</span><span class="s2"> website&quot;</span> <span class="c1"># 此行为新增代码</span>
    </span><span class='line'><span class="no">Bundler</span><span class="o">.</span><span class="n">with_clean_env</span> <span class="p">{</span> <span class="nb">system</span> <span class="s2">&quot;git push gitcafe </span><span class="si">#{</span><span class="n">deploy_branch</span><span class="si">}</span><span class="s2">:gitcafe-pages&quot;</span> <span class="p">}</span> <span class="c1"># 此行为新增代码</span>
    </span><span class='line'><span class="nb">puts</span> <span class="s2">&quot;</span><span class="se">\n</span><span class="s2">## GitCafe Pages deploy complete&quot;</span> <span class="c1"># 此行为新增代码</span>
    </span>`</pre></td></tr></table></div></figure>

    细心的你也许会有所发现，我们 `push` 到 GitCafe 上的远程分支名与 `push` 到 GitHub 上的远程分支名是不一样的。这是因为 GitHub 使用的是 `master` 分支来存放页面内容，而 GitCafe 则使用的是 `gitcafe-pages` 分支。不过，对这个我们不需要太过关心，知道是怎么回事就可以了，换汤不换药。

    接下来，运行一下发布命令试试效果吧！

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="n">rake</span> <span class="n">deploy</span>
    </span>`</pre></td></tr></table></div></figure>

    ## 自定义域名

    GitCafe 的自定义域名设置要比 GitHub 的友好得多，它不仅提供了图形界面，而且支持给一个项目设置多个域名。进入`项目设置`界面，然后在`Pages 服务`栏目中添加你自己的域名。

    ![GitCafe 自定义域名](http://leichunfeng.github.io/images/gitcafe-custom-domains-new.jpg "GitCafe 自定义域名")

    同样的，你需要登陆你的域名注册商的管理平台，在你的域名下新增相应的 `A` 或 `CNAME` 解析记录。如果你需要将域名指向一个 `IPv4` 地址（例如：`leichunfeng.com` -> `207.226.141.135` ），则需要增加 `A` 记录；而如果你需要将域名指向另一个域名（例如：`blog.leichunfeng.com` -> `leichunfeng.gitcafe.io` ），实现与被指向域名相同的访问效果，则需要增加 `CNAME` 记录。

    ![万网解析记录](http://leichunfeng.github.io/images/net-resolve-record-new.jpg "万网解析记录")

    ## 添加对 GitCafe 的感谢

    GitCafe 是国内为数不多的做得不错的代码托管网站，目前还处于创业阶段。如果你也想跟我一样，在博客底部添加对 GitCafe 的感谢，可以通过修改 `source/_includes/custom/footer.html` 文件来实现。**注意**，记得将 `http://gitcafe.com/signup?invited_by=leichunfeng` 中的 `leichunfeng` 替换成你的 GitCafe 用户名。

    <figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
    <span class='line-number'>2</span>
    <span class='line-number'>3</span>
    <span class='line-number'>4</span>
    <span class='line-number'>5</span>
    </pre></td><td class='code'><pre>`<span class='line'><span class="nt">&lt;p&gt;</span>
    </span><span class='line'>  Copyright <span class="ni">&amp;copy;</span> 2016-06-23 23:06:15 +0800 - 雷纯锋 -
    </span><span class='line'>  <span class="nt">&lt;span</span> <span class="na">class=</span><span class="s">&quot;credit&quot;</span><span class="nt">&gt;</span>Powered by <span class="nt">&lt;a</span> <span class="na">href=</span><span class="s">&quot;http://octopress.org&quot;</span><span class="nt">&gt;</span>Octopress<span class="nt">&lt;/a&gt;&lt;/span&gt;</span>
    </span><span class='line'>  <span class="nt">&lt;span</span> <span class="na">class=</span><span class="s">&quot;credit&quot;</span><span class="nt">&gt;</span> - 感谢 <span class="nt">&lt;a</span> <span class="na">href=</span><span class="s">&quot;http://gitcafe.com/signup?invited_by=leichunfeng&quot;</span> <span class="na">target=</span><span class="s">&quot;_blank&quot;</span><span class="nt">&gt;</span>GitCafe<span class="nt">&lt;/a&gt;</span> 为本站提供存储空间<span class="nt">&lt;/span&gt;</span>
    </span><span class='line'><span class="nt">&lt;/p&gt;</span>
    </span>
</td></tr></table></div></figure>

至此，迁移工作就全部完成了。Enjoy ！