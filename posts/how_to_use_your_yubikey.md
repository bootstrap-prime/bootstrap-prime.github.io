# A guide to practically using SSH keys on your Yubikey (or other security keys)

## Make sure your environment is set up to use this type of key.

### Windows

Follow install instructions for [openssh-sk-winhello](https://github.com/tavrez/openssh-sk-winhello).
Ensure ssh-agent is [started on git-bash boot automatically](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/working-with-ssh-key-passphrases#auto-launching-ssh-agent-on-git-for-windows).

Add this to your bashrc file:

``` bash
export SSH_SK_PROVIDER=/usr/lib/winhello.dll
```

### NixOS

Set

``` nix
programs.ssh.package = pkgs.openssh.override { withFIDO = true; };
```

in your configuration.nix. And ensure your endpoint servers have a OpenSSH version greater than 8.2, and that those servers are configured to accept sk backed keys. Github already supports sk-backed keys (as seen [here](https://github.blog/2021-05-10-security-keys-supported-ssh-git-operations/)).

## [SSH Keygen](https://man.openbsd.org/ssh-keygen.1)

comments aren't preserved, and your comments will be wiped when you load keys from resident. keep your public keyfile around, the comment gets stored there.

The private key generated by ssh-keygen isn't a normal private key. instead, it's a handle (what webauthn calls a "credential ID") to the key on your device. this is sort of safe to share, but why risk it? sometimes this is your private key wrapped in your authenticator's key, sometimes it's not. Yubikeys do funny magic to derive their private keys from that material instead of wrapping and encrypting it.

PINs, despite the name "personal identification _number_", do not consist solely of numbers. Instead, they can also be passwords or pass phrases. I recommend a long passphrase.

### Things you're probably interested in while using keys:

1.  application

    This lets you name your keys. they must begin with ssh, but if you don't specify this you'll overwrite your key each time. try doing username@purpose, or username@dest~hostname~

2.  resident

    this lets you store the key on the authenticator itself. Current limit for resident keys is 25 on a yubikey 5, but things like trezor up this to 50, and future ones will up it even further (presumably). don't be afraid of this, it's really convenient. As a bonus, it doesn't require you to remember another password. Yubikey 5s with firmware below 5.2.7 don't let you delete individual resident credentials, but if you purchased one recently, you should be fine.

3.  verify required

    Verify-required is a user verification check. This will password lock your ssh key. verify-required is NOT a user presence check, which just has you tap the blinking circle on your authenticator. Even if you don't specify verify-required, you will still be required to tap that blinking light. Support for verify-required was recently added, so if you get an error like 
    > sign~andsendpubkey~: signing failed for ED25519-SK "" from agent: agent refused operation
    
    or
    
    > FIDO verify-required key is not currently supported by ssh-agent
    just update to the latest version of openssh. 

### Example generation command:

``` bash
$ ssh-keygen -t ed25519-sk -C "<username>-<keyname>-<purpose>" -O resident -O application=ssh:<username>@<purpose>
```

ed25519 is recommended over ecdsa. Yubikey fw version 5.2.7 added ed25519 support, so if you bought one recently it should already support this. If not, ecdsa is also fine, as reducing threat model from "everyone" to "nation-states" is a desirable reduction, and you're probably not important enough to bother with anyway.

Make sure to generate keys on your backup keys too, in case you lose your primary.

### To add resident credentials to your keyring, run

``` bash
ssh-add -K
```

If your ssh-agent is not running, run

``` bash
eval `ssh-agent -s`
```

and then run the above command.

If you want to import your resident credential locally to avoid having to run \`ssh-add -K\` every time, run

``` bash
ssh-keygen -K
```

Recent versions of SSH support using your security key to sign things! And git supports interpreting these signatures! There is no reason to torture yourself with gpg any longer. Recent versions of libfido2 also have support for [bluetooth security keys](https://github.com/Yubico/libfido2/pull/169), which should include app-based solutions, [like wearauthn](https://github.com/fmeum/WearAuthn/issues/9) or [wiokey](https://www.wiokey.de/en/) ([recommended by the wearauthn dev](https://github.com/fmeum/WearAuthn/issues/3)). I have gotten wiokey to work with windows, but not linux. Your mileage may vary.

### Bugs

This type of key cannot be used with the pam ssh module, it does not yet support \*-sk keys. <https://github.com/jbeverly/pam_ssh_agent_auth/issues/28>

## GPG

GPG keys can be stored on the PIV slot of a yubikey. Unfortunately, as you know, GPG is horrible. [This tutorial from yubico](https://support.yubico.com/hc/en-us/articles/360013790259-Using-Your-YubiKey-with-OpenPGP) covers setting one up on your yubikey. if you already have a master gpg key, you know the drill. I recommend generating an ed25519 key if your device supports it. only generate a signing key if possible, gpg is not recommended for encryption or authentication. Prefer age and ssh or webauthn for those tasks, respectively. Github now has support for SSH signing, so you should be able to be mostly free from gpg forever now.

If you do not have a gpg key already created, for maximum paranoia, you can load an ephemeral environment for secure generation. [Here](https://gist.github.com/bootstrap-prime/bbfa8fe47e703aacb42feb46c4017222) is a link to a nix expression that generates that environment.
