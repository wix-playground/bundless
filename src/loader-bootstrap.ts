declare const locator;
declare const projectMap;
System['normalize'] = locator.getModuleLocator(projectMap, System['normalize'].bind(System));
System.config(projectMap.system);