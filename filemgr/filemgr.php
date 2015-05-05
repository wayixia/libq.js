
<?php

// require 'config.php';

define(FILE_FILTER_FILE, 0x0001);
define(FILE_FILTER_DIR,  0x0002);
define(FILE_FILTER_USINGPARENT,  0x0004);
define(FILE_FILTER_USINGROOT,  0x0008);
define(FILE_FILTER_ALL, FILE_FILTER_FILE
						|FILE_FILTER_DIR
						|FILE_FILTER_USINGPARENT
						|FILE_FILTER_USINGROOT);

class CLASS_FILE {
	//! 当前请求路径
	private $sCurrentPath;
	//! 根目录
	private $sRootDir;
	//! 文件过滤
	private $filterType;
	
	function __construct() {

		// 加载配置器
		$cfg = require(dirname(__FILE__).'/config.php');
		$this->sRootDir = $cfg[$_GET['cfg']];
		unset($cfg);

		$this->filterType = FILE_FILTER_ALL;
		{
			//! 请求类型
			$f = intval($_GET['f'],10);
			if(!empty($f)) {
				$this->filterType = $f;
			}
		}
		
		//! 扩展名过滤
		$exts = array();
		{
			$e = $_GET['e'];
			if(!empty($e)) { 
				$exts = split("/\\s*,\\s*/", $e);
			}
		}
		
		// QueryString Path
		$this->sRootDir = $this->CT($this->sRootDir);
		{
			$p = $_GET['p'];
			//echo $p;
			if(empty($p) || ("/" ==  $p)) {
				$this->sCurrentPath = $this->sRootDir;
				$this->filterType &= ~FILE_FILTER_USINGPARENT;
			} else {
				$this->sCurrentPath = $this->sRootDir.$this->CT($p);
			}
		}
		
		//! 字符转码
		$this->sCurrentPath = $this->utf2gbk($this->sCurrentPath);
		//echo $this->sCurrentPath;
		//echo is_dir($this->sCurrentPath)?'true':'false';

		//! 路径不存在则使用根目录
		if(!is_dir($this->sCurrentPath)) {
			$this->sCurrentPath = $this->sRootDir;
			$this->filterType &= ~FILE_FILTER_USINGPARENT;
		}
		
		// echo $this->sCurrentPath;
		$arr = $this->get($this->sCurrentPath,$exts);

		//! 根据条件读取
		echo json_encode($arr);
	}

	function CLASS_FILE () { $this->__construct();}
	
	// 获取文件夹信息，可以根据指定的过滤器过滤相应的文件类型
	function get($path, $ext = array()) {
		$json = array();
		// 根目录
		if($this->IsFilter(FILE_FILTER_USINGROOT)) {
			array_push($json, array(
				"special"  => 0,
				"isfolder" => true, 
				"path" => '/', 
				"name" => "根目录", 
				"filesize" => '',
				"lastupdated" => '')
			);
		}
		
		if($this->IsFilter(FILE_FILTER_USINGPARENT)&& $path != $this->sRootDir) {
			$parentDir = $this->gbk2utf($this->getParentFolder($path));
			$parentDir = str_ireplace($this->sRootDir, '', $this->CT($parentDir));
			array_push($json, array(
				"special"  => 1,
				"isfolder" => true, 
				"path" => $parentDir, 
				"name" => "上级目录", 
				"filesize" => '',
				"lastupdated" => '')
			);
		}

		$handle = opendir($path);
		$extlen = count($ext);
		if(!$handle) { return; }
		while($file = readdir($handle)){
			if($file=="."||$file=="..") { continue; }
			$newFilePath = $path.DIRECTORY_SEPARATOR.$file;	// 路径
			$tm = $this->fmtDateTime(filemtime($newFilePath));	// 时间
			$name = $this->gbk2utf($file);
			if(is_dir($newFilePath) && ($this->IsFilter(FILE_FILTER_DIR))) {
				array_push($json, array(
					"special"  => 2,
					"isfolder" => true, 
					"path" => $this->gbk2utf(str_ireplace($this->sRootDir, '', $this->CT($path))), //($this->sRootDir, '', $this->CT($newFilePath)), 
					"name" => $name, 
					"filesize" => "", 
					"lastupdated" => $tm)
				);
			} else if(is_file($newFilePath) && ($this->IsFilter(FILE_FILTER_FILE))) {
				$fext = $this->GetFileExt($name);
				if( $extlen > 0) {
					if(!in_array($fext, $ext)) { continue; }
				}
				$fsize = filesize($newFilePath);
				array_push($json, array(
					"special"  => 2,
					"isfolder" => false, 
					"path" =>  $this->gbk2utf(str_ireplace($this->sRootDir, '', $this->CT($path))), 
					"name" => $name, 
					"filesize" => $fsize,
					"lastupdated" => $tm)
				);
			}
		}
		closedir($handle);
		return $json;
	}
	
	function IsFilter($fws) {
		return (($this->filterType & $fws) == $fws);
	}

	function fmtDateTime($timestamp) {
		$timestamp = intval($timestamp,10);
		if($timestamp == 0) {
			return "";	
		}
		return strftime("%Y-%m-%d %H:%M:%S", $timestamp);
	}

	// 格式化时间
	function fmtDateTime2CN($timestamp) {
		$timestamp = intval($timestamp);
		if($timestamp == 0) {
			return "";	
		}
		return strftime("%Y年%m月%d日 %H:%M:%S", $timestamp);
	}


	function GetFileExt($filename) {
		$retval="";
		$pt=strrpos($filename, ".");
		if ($pt) $retval=substr($filename, $pt+1, strlen($filename) - $pt);
		return ($retval);
	}

	// 将UTF-8转换成GBK
	function latin2utf($str) {
		return iconv("latin1", "gbk//IGNORE", $str);
	}

	// 将UTF-8转换成GBK
	function utf2gbk($str) {
		return iconv("UTF-8", "gb2312//IGNORE", $str);    
	}

	// 将GBK转换成UTF-8
	function gbk2utf($str) {
		return iconv("gbk", "UTF-8", $str);    
	}
	
	// 将 反斜杠转换成正斜杠
	function CT($sPath) {
		// \ -> /
		return str_ireplace("\\", "/", $sPath);
	}
	
	//! 获取父文件夹
	function getParentFolder($folder) {
		$sPattern = "-[/\\\\][^/\\\\]+[/\\\\]?$-" ;
		return preg_replace( $sPattern, '', $folder ) ;
	}
}

new CLASS_FILE;

?>